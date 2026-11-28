import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { buildOrderItemsTableHtml } from '@/lib/email/placeholders'
import { renderEmailTemplate } from '@/lib/email/renderEmailTemplate'

let payload: Payload

describe('LMS Backend CMS', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('registers WordPress, Ecommerce, SEO, and Email collections', () => {
    const slugs = Object.keys(payload.collections)
    expect(slugs).toEqual(
      expect.arrayContaining([
        'users',
        'media',
        'videos',
        'categories',
        'tags',
        'pages',
        'posts',
        'courses',
        'course-modules',
        'lessons',
        'email-templates',
        'products',
        'carts',
        'orders',
        'addresses',
        'transactions',
      ]),
    )
    expect(slugs).not.toContain('variants')
    expect(slugs).not.toContain('variantTypes')
    expect(slugs).not.toContain('variantOptions')
    expect(payload.email.name).toBe('nodemailer')
    expect(payload.collections.videos.config.upload?.mimeTypes).toEqual(['video/*'])
    expect(payload.config.localization).toBeTruthy()
    if (payload.config.localization) {
      expect(payload.config.localization.defaultLocale).toBe('en')
      expect(payload.config.localization.localeCodes).toEqual(['en', 'hi'])
    }
  })

  it('supports English and Hindi localization with en default fallback', async () => {
    const tag = await payload.create({
      collection: 'tags',
      locale: 'en',
      data: {
        name: 'Web Development',
        slug: `web-dev-${Date.now()}`,
        description: 'English tag description',
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'tags',
      id: tag.id,
      locale: 'hi',
      data: {
        name: 'वेब डेवलपमेंट',
      },
      overrideAccess: true,
    })

    const enDoc = await payload.findByID({
      collection: 'tags',
      id: tag.id,
      locale: 'en',
      overrideAccess: true,
    })
    const hiDoc = await payload.findByID({
      collection: 'tags',
      id: tag.id,
      locale: 'hi',
      overrideAccess: true,
    })

    expect(enDoc.name).toBe('Web Development')
    expect(hiDoc.name).toBe('वेब डेवलपमेंट')
    expect(hiDoc.description).toBe('English tag description')

    await payload.delete({
      collection: 'tags',
      id: tag.id,
      overrideAccess: true,
    })
  })

  it('seeds WooCommerce-style email templates and renders placeholders', async () => {
    const { docs } = await payload.find({
      collection: 'email-templates',
      where: { slug: { equals: 'customer_processing_order' } },
      limit: 1,
      overrideAccess: true,
    })

    const template = docs[0]
    expect(template).toBeDefined()

    const itemsTable = buildOrderItemsTableHtml(
      [{ name: 'Full Stack Course', quantity: 1, total: '$99.00', sku: 'CRS-101' }],
      '$99.00',
    )

    const rendered = renderEmailTemplate({
      template: template!,
      settings: {
        siteTitle: 'Acme Academy',
        baseColor: '#7f54b3',
        footerText: '{site_title} Support',
      },
      data: {
        order_number: '1042',
        order_total: '$99.00',
        customer_first_name: 'Ada <script>',
        billing_address: '123 Main St',
        order_items_table: itemsTable,
      },
    })

    expect(rendered.subject).toBe('Your Acme Academy order has been received!')
    expect(rendered.heading).toBe('Thank you for your order')
    expect(rendered.html).toContain('#1042')
    expect(rendered.html).toContain('Ada &lt;script&gt;')
    expect(rendered.html).toContain('Full Stack Course')
    expect(rendered.html).toContain('Acme Academy Support')
    expect(rendered.text).toContain('Thank you for your order')
  })
})
