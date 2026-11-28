import { getEnv } from '@lms/env'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { ecommercePlugin, EUR, GBP, USD } from '@payloadcms/plugin-ecommerce'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import dotenv from 'dotenv'
import path from 'path'
import { buildConfig, slugField } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import {
  adminOrPublishedStatus,
  isAdmin,
  isAdminField,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
  publicAccess,
} from './access'
import { Categories } from './collections/Categories'
import { Lessons } from './collections/courses/lessons'
import { CourseModules } from './collections/courses/modules'
import { Courses } from './collections/courses/schema'
import { EmailTemplates } from './collections/EmailTemplates'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Videos } from './collections/Videos'
import { defaultLexical } from './fields/defaultLexical'
import { EmailSettings } from './globals/EmailSettings'
import { GoogleCalendarSettings } from './globals/GoogleCalendarSettings'
import { seedDefaultEmailTemplates } from './lib/email/defaultTemplates'
import { createGoogleOAuthUrl, exchangeGoogleOAuthCode } from './lib/google/calendar'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './lib/localization'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../../.env') })

const siteUrl = getEnv('SITE_URL') || getEnv('NEXT_PUBLIC_SERVER_URL', 'http://127.0.0.1:3000')
const s3Bucket = getEnv('S3_BUCKET_NAME', '')
const s3AccessKeyId = getEnv('S3_ACCESS_KEY_ID', '')
const s3SecretAccessKey = getEnv('S3_SECRET_ACCESS_KEY', '')
const s3Endpoint = getEnv('S3_ENDPOINT_URL')
const s3Enabled = Boolean(s3Bucket && s3AccessKeyId && s3SecretAccessKey)
const mailHost = getEnv('MAIL_HOST')
const mailPort = getEnv('MAIL_PORT', 465)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Videos, Categories, Tags, Pages, Posts, Courses, CourseModules, Lessons, EmailTemplates],
  globals: [EmailSettings, GoogleCalendarSettings],
  localization: {
    locales: [...SUPPORTED_LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  endpoints: [
    {
      path: '/google/oauth/url',
      method: 'get',
      handler: async (req) => {
        if (!req.user || req.user.role !== 'admin') {
          return Response.json({ error: 'Unauthorized' }, { status: 403 })
        }
        try {
          const url = createGoogleOAuthUrl()
          const accept = req.headers.get('accept') || ''
          const reqUrl = new URL(req.url || siteUrl)
          if (reqUrl.searchParams.get('format') !== 'json' && accept.includes('text/html')) {
            return Response.redirect(url, 302)
          }
          return Response.json({ url })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Google OAuth2 is not configured.'
          return Response.json({ error: message }, { status: 400 })
        }
      },
    },
    {
      path: '/google/oauth/callback',
      method: 'get',
      handler: async (req) => {
        const url = new URL(req.url || siteUrl)
        const code = url.searchParams.get('code')
        if (!code) {
          return Response.json({ error: 'Missing OAuth authorization code' }, { status: 400 })
        }
        try {
          await exchangeGoogleOAuthCode({ code, payload: req.payload })
          return Response.redirect(`${siteUrl.replace(/\/$/, '')}/admin/globals/google-calendar-settings`, 302)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'OAuth callback failed'
          return Response.json({ error: message }, { status: 500 })
        }
      },
    },
  ],
  editor: defaultLexical,
  email: nodemailerAdapter({
    defaultFromAddress: getEnv('MAIL_FROM_ADDRESS', 'no-reply@example.com'),
    defaultFromName: getEnv('MAIL_FROM_NAME', 'LMS'),
    skipVerify: !getEnv('MAIL_VERIFY', false),
    ...(mailHost
      ? {
          transportOptions: {
            host: mailHost,
            port: mailPort,
            secure: getEnv('MAIL_ENCRYPTION') === 'ssl' || mailPort === 465,
            auth: {
              user: getEnv('MAIL_USERNAME'),
              pass: getEnv('MAIL_PASSWORD'),
            },
          },
        }
      : {}),
  }),
  secret: getEnv('PAYLOAD_SECRET', ''),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: getEnv('DATABASE_URL', ''),
    },
  }),
  sharp,
  onInit: async (payload) => {
    await seedDefaultEmailTemplates(payload)
  },
  plugins: [
    ecommercePlugin({
      access: {
        adminOnlyFieldAccess: isAdminField,
        adminOrPublishedStatus,
        isAdmin,
        isAuthenticated,
        isCustomer,
        isDocumentOwner,
        publicAccess,
      },
      addresses: true,
      carts: {
        allowGuestCarts: true,
      },
      currencies: {
        defaultCurrency: 'USD',
        supportedCurrencies: [
          USD,
          {
            code: 'INR',
            decimals: 2,
            label: 'Indian Rupee',
            symbol: '₹',
            symbolDisplay: 'symbol',
          },
          EUR,
          GBP,
        ],
      },
      customers: {
        slug: 'users',
      },
      inventory: true,
      orders: true,
      products: {
        productsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: {
            ...defaultCollection.admin,
            useAsTitle: 'title',
            defaultColumns: ['title', 'slug', 'prices', '_status', 'updatedAt'],
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
            },
            slugField({
              useAsSlug: 'title',
            }),
            {
              name: 'description',
              type: 'richText',
              editor: defaultLexical,
              localized: true,
            },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                position: 'sidebar',
              },
            },
            ...defaultCollection.fields,
          ],
        }),
        variants: false,
      },
      transactions: true,
    }),
    seoPlugin({
      collections: ['pages', 'posts', 'courses', 'products'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => {
        const title = (doc as { title?: string } | undefined)?.title
        return title ? `${title} | LMS` : 'LMS'
      },
      generateDescription: ({ doc }) => {
        const record = doc as
          | { excerpt?: string; shortDescription?: string; meta?: { description?: string } }
          | undefined
        return record?.excerpt || record?.shortDescription || record?.meta?.description || ''
      },
      generateURL: ({ doc, collectionConfig, locale }) => {
        const slug = (doc as { slug?: string } | undefined)?.slug || ''
        const prefix = locale && locale !== DEFAULT_LOCALE ? `/${locale}` : ''
        if (!slug) return `${siteUrl}${prefix}`
        if (collectionConfig?.slug === 'pages') return `${siteUrl}${prefix}/${slug}`
        return `${siteUrl}${prefix}/${collectionConfig?.slug || 'pages'}/${slug}`
      },
    }),
    s3Storage({
      enabled: s3Enabled,
      clientUploads: {
        access: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'instructor',
      },
      collections: {
        media: {
          prefix: 'media',
        },
        videos: {
          prefix: 'videos',
          signedDownloads: {
            expiresIn: 7200,
            shouldUseSignedURL: () => true,
          },
        },
      },
      bucket: s3Bucket,
      config: {
        endpoint: s3Endpoint,
        forcePathStyle: Boolean(s3Endpoint),
        region: getEnv('S3_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
      },
    }),
  ],
})
