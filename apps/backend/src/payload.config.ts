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
import { EmailTemplates } from './collections/EmailTemplates'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { defaultLexical } from './fields/defaultLexical'
import { EmailSettings } from './globals/EmailSettings'
import { seedDefaultEmailTemplates } from './lib/email/defaultTemplates'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../../.env') })

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:3000'
const s3Enabled = Boolean(
  process.env.S3_BUCKET_NAME && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
)
const mailPort = Number(process.env.MAIL_PORT) || 465

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Tags, Pages, Posts, EmailTemplates],
  globals: [EmailSettings],
  editor: defaultLexical,
  email: nodemailerAdapter({
    defaultFromAddress: process.env.MAIL_FROM_ADDRESS || 'no-reply@example.com',
    defaultFromName: process.env.MAIL_FROM_NAME || 'LMS',
    skipVerify: process.env.MAIL_VERIFY !== 'true',
    ...(process.env.MAIL_HOST
      ? {
          transportOptions: {
            host: process.env.MAIL_HOST,
            port: mailPort,
            secure: process.env.MAIL_ENCRYPTION === 'ssl' || mailPort === 465,
            auth: {
              user: process.env.MAIL_USERNAME,
              pass: process.env.MAIL_PASSWORD,
            },
          },
        }
      : {}),
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
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
            },
            slugField({
              useAsSlug: 'title',
            }),
            {
              name: 'description',
              type: 'richText',
              editor: defaultLexical,
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
        variants: true,
      },
      transactions: true,
    }),
    seoPlugin({
      collections: ['pages', 'posts', 'products'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => {
        const title = (doc as { title?: string } | undefined)?.title
        return title ? `${title} | LMS` : 'LMS'
      },
      generateDescription: ({ doc }) => {
        const record = doc as { excerpt?: string; meta?: { description?: string } } | undefined
        return record?.excerpt || record?.meta?.description || ''
      },
      generateURL: ({ doc, collectionConfig }) => {
        const slug = (doc as { slug?: string } | undefined)?.slug || ''
        if (!slug) return siteUrl
        if (collectionConfig?.slug === 'pages') return `${siteUrl}/${slug}`
        return `${siteUrl}/${collectionConfig?.slug || 'pages'}/${slug}`
      },
    }),
    s3Storage({
      enabled: s3Enabled,
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.S3_BUCKET_NAME || '',
      config: {
        endpoint: process.env.S3_ENDPOINT_URL || undefined,
        forcePathStyle: Boolean(process.env.S3_ENDPOINT_URL),
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
