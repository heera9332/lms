import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { adminOrPublishedStatus, isAdmin, isAdminOrInstructor } from '../../access'

export const CourseModules: CollectionConfig = {
  slug: 'course-modules',
  labels: {
    singular: 'Course Module',
    plural: 'Course Modules',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'course', 'order', 'isFreePreview', '_status', 'updatedAt'],
    group: 'LMS',
  },
  access: {
    create: isAdminOrInstructor,
    delete: isAdmin,
    read: adminOrPublishedStatus,
    update: isAdminOrInstructor,
  },
  versions: {
    drafts: {
      autosave: true,
    },
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
      type: 'textarea',
    },
    {
      name: 'lessons',
      type: 'relationship',
      relationTo: 'lessons',
      hasMany: true,
      admin: {
        description: 'Select and order the lessons / classes belonging to this module.',
      },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
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
      },
    },
  ],
}
