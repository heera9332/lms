import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrInstructor, publicAccess } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    create: isAdminOrInstructor,
    delete: isAdmin,
    read: publicAccess,
    update: isAdminOrInstructor,
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
