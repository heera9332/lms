import type { CollectionConfig } from 'payload'

import { isAdmin, publicAccess } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: publicAccess,
    update: isAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
  upload: true,
}
