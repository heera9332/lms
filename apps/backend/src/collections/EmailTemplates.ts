import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access'
import { defaultLexical } from '../fields/defaultLexical'

export const EMAIL_TEMPLATE_EVENTS = [
  { label: 'New Order (Admin)', value: 'new_order' },
  { label: 'Cancelled Order (Admin)', value: 'cancelled_order' },
  { label: 'Failed Order (Admin)', value: 'failed_order' },
  { label: 'Order On-Hold (Customer)', value: 'customer_on_hold_order' },
  { label: 'Processing Order (Customer)', value: 'customer_processing_order' },
  { label: 'Completed Order (Customer)', value: 'customer_completed_order' },
  { label: 'Refunded Order (Customer)', value: 'customer_refunded_order' },
  { label: 'Customer Invoice / Order Details', value: 'customer_invoice' },
  { label: 'Customer Note', value: 'customer_note' },
  { label: 'New Account', value: 'customer_new_account' },
  { label: 'Reset Password', value: 'customer_reset_password' },
  { label: 'Custom', value: 'custom' },
] as const

export const EmailTemplates: CollectionConfig = {
  slug: 'email-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'event', 'recipientType', 'enabled', 'updatedAt'],
    group: 'Emails',
    description:
      'WooCommerce-style transactional email templates. Use {placeholder} or {{placeholder}} tokens in subject, heading, body, and additional content.',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique template key (e.g. new_order, customer_processing_order).',
      },
    },
    {
      name: 'event',
      type: 'select',
      required: true,
      defaultValue: 'custom',
      options: [...EMAIL_TEMPLATE_EVENTS],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Enable or disable sending this email notification.',
      },
    },
    {
      name: 'emailType',
      type: 'select',
      defaultValue: 'html',
      options: [
        { label: 'HTML', value: 'html' },
        { label: 'Plain Text', value: 'plain' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'recipientType',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
        { label: 'Custom Recipients', value: 'custom' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'recipients',
      type: 'text',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.recipientType !== 'customer',
        description: 'Comma-separated recipient email addresses (defaults to MAIL_FROM_ADDRESS for admin emails).',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
      admin: {
        description: 'Supports placeholders such as [{site_title}]: New order #{order_number}',
      },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        description: 'Email header banner title. Supports placeholders such as New Order: #{order_number}',
      },
    },
    {
      name: 'body',
      type: 'richText',
      editor: defaultLexical,
      admin: {
        description:
          'Main email content. Supports placeholders like {customer_name}, {order_number}, {order_date}, {order_total}, {order_items_table}, {billing_address}, {reset_url}.',
      },
    },
    {
      name: 'additionalContent',
      type: 'textarea',
      defaultValue: 'Thanks for using {site_title}!',
      admin: {
        description: 'Footer note shown below the main email content. Supports placeholders.',
      },
    },
    {
      name: 'availablePlaceholders',
      type: 'array',
      admin: {
        description: 'Documented placeholders supported by this template.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'token',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
  ],
}
