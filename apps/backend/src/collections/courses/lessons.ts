import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { adminOrPublishedStatus, isAdmin, isAdminOrInstructor } from '../../access'
import { defaultLexical } from '../../fields/defaultLexical'

const setPublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data?._status === 'published' && !data.publishedAt) {
    return {
      ...data,
      publishedAt: new Date().toISOString(),
    }
  }
  return data
}

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  labels: {
    singular: 'Lesson',
    plural: 'Lessons',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'lessonType', 'durationMinutes', 'isFreePreview', '_status', 'updatedAt'],
    group: 'LMS',
  },
  access: {
    create: isAdminOrInstructor,
    delete: isAdmin,
    read: adminOrPublishedStatus,
    update: isAdminOrInstructor,
  },
  hooks: {
    beforeChange: [setPublishedAt],
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
      name: 'content',
      type: 'richText',
      editor: defaultLexical,
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.lessonType === 'video',
        description: 'Video URL or stream reference for recorded lessons.',
      },
    },
    {
      name: 'liveMeetingUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.lessonType === 'live',
        description: 'Live class session URL (e.g. Google Meet link).',
      },
    },
    {
      name: 'resource',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data?.lessonType === 'pdf' || data?.lessonType === 'resource',
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.lessonType === 'external',
      },
    },
    {
      name: 'lessonType',
      type: 'select',
      required: true,
      defaultValue: 'video',
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Live Session', value: 'live' },
        { label: 'Text / Article', value: 'article' },
        { label: 'PDF / Document', value: 'pdf' },
        { label: 'Downloadable Resource', value: 'resource' },
        { label: 'Quiz', value: 'quiz' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'External Link', value: 'external' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'durationMinutes',
      type: 'number',
      min: 0,
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
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'course-modules',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: {
        role: { in: ['admin', 'instructor'] },
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
