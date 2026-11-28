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
        'categories',
        'tags',
        'pages',
        'posts',
        'courses',
        'email-templates',
        'products',
        'variants',
        'variantTypes',
        'variantOptions',
        'carts',
        'orders',
        'addresses',
        'transactions',
      ]),
    )
    expect(payload.email.name).toBe('nodemailer')
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
