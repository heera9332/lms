import type { Payload } from 'payload'

import { STANDARD_PLACEHOLDERS } from './placeholders'

function createLexicalParagraphs(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

export const DEFAULT_EMAIL_TEMPLATES = [
  {
    name: 'New Order',
    slug: 'new_order',
    event: 'new_order' as const,
    enabled: true,
    emailType: 'html' as const,
    recipientType: 'admin' as const,
    description: 'New order emails are sent to chosen recipient(s) when a new order is received.',
    subject: '[{site_title}]: New order #{order_number}',
    heading: 'New Order: #{order_number}',
    body: createLexicalParagraphs([
      'You have received the following order from {customer_name}:',
      'Order #{order_number} ({order_date}) — Status: {order_status}',
      '{order_items_table}',
      'Total: {order_total}',
      'Customer email: {customer_email}',
      'Billing address: {billing_address}',
    ]),
    additionalContent: 'Congratulations on the sale.',
    availablePlaceholders: STANDARD_PLACEHOLDERS.map((p) => ({
      token: p.token,
      description: p.description,
    })),
  },
  {
    name: 'Cancelled Order',
    slug: 'cancelled_order',
    event: 'cancelled_order' as const,
    enabled: true,
    emailType: 'html' as const,
    recipientType: 'admin' as const,
    description: 'Cancelled order emails are sent to chosen recipient(s) when orders have been marked cancelled.',
    subject: '[{site_title}]: Order #{order_number} has been cancelled',
    heading: 'Order Cancelled: #{order_number}',
    body: createLexicalParagraphs([
      'Notification to let you know — order #{order_number} belonging to {customer_name} has been cancelled:',
      '{order_items_table}',
      'Total: {order_total}',
    ]),
    additionalContent: 'Thanks for reading.',
    availablePlaceholders: STANDARD_PLACEHOLDERS.map((p) => ({
      token: p.token,
      description: p.description,
    })),
  },
  {
    name: 'Processing Order',
    slug: 'customer_processing_order',
    event: 'customer_processing_order' as const,
    enabled: true,
    emailType: 'html' as const,
    recipientType: 'customer' as const,
    description: 'Order notification sent to customers containing order details after payment.',
    subject: 'Your {site_title} order has been received!',
    heading: 'Thank you for your order',
    body: createLexicalParagraphs([
      'Hi {customer_first_name},',
      'Just to let you know — we have received your order #{order_number}, and it is now being processed:',
      '{order_items_table}',
      'Total: {order_total}',
      'Billing address: {billing_address}',
    ]),
    additionalContent: 'Thanks for using {site_title}!',
    availablePlaceholders: STANDARD_PLACEHOLDERS.map((p) => ({
      token: p.token,
      description: p.description,
    })),
  },
  {
    name: 'Completed Order',
    slug: 'customer_completed_order',
    event: 'customer_completed_order' as const,
    enabled: true,
    emailType: 'html' as const,
    recipientType: 'customer' as const,
    description: 'Order complete emails are sent to customers when their orders are marked completed.',
    subject: 'Your {site_title} order is now complete',
    heading: 'Thanks for shopping with us',
    body: createLexicalParagraphs([
      'Hi {customer_first_name},',
      'We have finished processing your order #{order_number} ({order_date}).',
      '{order_items_table}',
      'Total: {order_total}',
    ]),
    additionalContent: 'Thanks for shopping with us.',
    availablePlaceholders: STANDARD_PLACEHOLDERS.map((p) => ({
      token: p.token,
      description: p.description,
    })),
  },
  {
    name: 'Customer Invoice / Order Details',
    slug: 'customer_invoice',
    event: 'customer_invoice' as const,
    enabled: true,
    emailType: 'html' as const,
    recipientType: 'customer' as const,
    description: 'Customer invoice emails can be sent to customers containing their order information and payment links.',
    subject: 'Invoice for order #{order_number} on {site_title}',
    heading: 'Details for order #{order_number}',
    body: createLexicalParagraphs([
      'Hi {customer_first_name},',
      'Here are the details of your order placed on {order_date}:',
      '{order_items_table}',
      'Total: {order_total}',
    ]),
    additionalContent: 'Thanks for reading.',
    availablePlaceholders: STANDARD_PLACEHOLDERS.map((p) => ({
      token: p.token,
      description: p.description,
    })),
  },
  {
    name: 'New Account',
    slug: 'customer_new_account',
    event: 'customer_new_account' as const,
    enabled: true,
    emailType: 'html' as const,
    recipientType: 'customer' as const,
    description: 'Customer "new account" emails are sent to the customer when a user signs up.',
    subject: 'Your {site_title} account has been created!',
    heading: 'Welcome to {site_title}',
    body: createLexicalParagraphs([
      'Hi {customer_first_name},',
      'Thanks for creating an account on {site_title}. Your username is {user_login}.',
      'You can access your account at {site_url}.',
    ]),
    additionalContent: 'We look forward to seeing you soon.',
    availablePlaceholders: STANDARD_PLACEHOLDERS.map((p) => ({
      token: p.token,
      description: p.description,
    })),
  },
  {
    name: 'Reset Password',
    slug: 'customer_reset_password',
    event: 'customer_reset_password' as const,
    enabled: true,
    emailType: 'html' as const,
    recipientType: 'customer' as const,
    description: 'Customer "reset password" emails are sent when customers reset their passwords.',
    subject: 'Password Reset Request for {site_title}',
    heading: 'Password Reset Request',
    body: createLexicalParagraphs([
      'Hi {customer_first_name},',
      'Someone has requested a new password for the following account on {site_title}:',
      'Username: {user_login}',
      'To reset your password, visit: {reset_url}',
    ]),
    additionalContent: 'If you did not make this request, just ignore this email.',
    availablePlaceholders: STANDARD_PLACEHOLDERS.map((p) => ({
      token: p.token,
      description: p.description,
    })),
  },
]

export async function seedDefaultEmailTemplates(payload: Payload): Promise<void> {
  try {
    const { docs: existing } = await payload.find({
      collection: 'email-templates',
      limit: 100,
      select: { slug: true },
      overrideAccess: true,
    })

    const existingSlugs = new Set(existing.map((doc) => doc.slug))
    const missing = DEFAULT_EMAIL_TEMPLATES.filter((t) => !existingSlugs.has(t.slug))

    for (const template of missing) {
      try {
        await payload.create({
          collection: 'email-templates',
          locale: 'en',
          data: template,
          overrideAccess: true,
        })
      } catch {
        // Ignore concurrent seed race on unique slug
      }
    }
  } catch (err) {
    payload.logger.warn({ err, msg: 'Skipping default email template seeding' })
  }
}
