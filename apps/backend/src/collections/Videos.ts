import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrInstructor } from '../access'

export const Videos: CollectionConfig = {
  slug: 'videos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'durationSeconds', 'isFreePreview', 'updatedAt'],
    group: 'LMS',
  },
  access: {
    create: isAdminOrInstructor,
    delete: isAdmin,
    read: ({ req: { user } }) => {
      if (user) return true
      return { isFreePreview: { equals: true } }
    },
    update: isAdminOrInstructor,
  },
  upload: {
    mimeTypes: ['video/*'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'durationSeconds',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isFreePreview',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Allow unauthenticated preview playback for this video.',
      },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      defaultValue: ({ user }) => user?.id,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
