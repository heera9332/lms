import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { isAdmin, publicAccess } from '../access'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
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
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField({
      useAsSlug: 'name',
    }),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
  ],
}
