import type { GlobalConfig } from 'payload'

import { isAdmin } from '../access'

export const EmailSettings: GlobalConfig = {
  slug: 'email-settings',
  admin: {
    group: 'Emails',
    description: 'WooCommerce-style global email sender and branding configuration.',
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'siteTitle',
      type: 'text',
      defaultValue: 'LMS',
    },
    {
      name: 'fromName',
      type: 'text',
      defaultValue: 'LMS',
    },
    {
      name: 'fromAddress',
      type: 'email',
    },
    {
      name: 'headerImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'footerText',
      type: 'textarea',
      defaultValue: '{site_title} — Powered by Payload CMS',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'baseColor',
          type: 'text',
          defaultValue: '#7f54b3',
        },
        {
          name: 'backgroundColor',
          type: 'text',
          defaultValue: '#f7f7f7',
        },
        {
          name: 'bodyBackgroundColor',
          type: 'text',
          defaultValue: '#ffffff',
        },
        {
          name: 'bodyTextColor',
          type: 'text',
          defaultValue: '#3c3c3c',
        },
      ],
    },
  ],
}
