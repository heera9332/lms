import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { adminOrPublishedStatus, isAdmin, isAdminOrInstructor } from '../../access'
import { defaultLexical } from '../../fields/defaultLexical'
import { DEFAULT_LOCALE, LOCALE_SELECT_OPTIONS } from '../../lib/localization'

const setPublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  if (data?._status === 'published' && !data.publishedAt) {
    return {
      ...data,
      publishedAt: new Date().toISOString(),
    }
  }
  return data
}

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'courseType', 'pricingType', 'difficultyLevel', '_status', 'updatedAt'],
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
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
            },
            slugField({
              useAsSlug: 'title',
            }),
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
            },
            {
              name: 'description',
              type: 'richText',
              editor: defaultLexical,
              localized: true,
            },
            {
              name: 'promoVideoUrl',
              type: 'text',
              admin: {
                description: 'Optional promotional video URL for the course landing page.',
              },
            },
            {
              name: 'learningObjectives',
              type: 'array',
              localized: true,
              fields: [
                {
                  name: 'objective',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'requirements',
              type: 'array',
              localized: true,
              fields: [
                {
                  name: 'requirement',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'outcomes',
              type: 'array',
              localized: true,
              fields: [
                {
                  name: 'outcome',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Curriculum',
          fields: [
            {
              name: 'modules',
              type: 'relationship',
              relationTo: 'course-modules',
              hasMany: true,
              admin: {
                description: 'Select and order the course modules for this course.',
              },
            },
          ],
        },
        {
          label: 'Pricing & Access',
          fields: [
            {
              name: 'pricingType',
              type: 'select',
              required: true,
              defaultValue: 'paid',
              options: [
                { label: 'Free', value: 'free' },
                { label: 'Paid', value: 'paid' },
              ],
            },
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              admin: {
                condition: (data) => data?.pricingType === 'paid',
                description: 'Linked Ecommerce product used for checkout and multi-currency pricing.',
              },
            },
            {
              name: 'accessModel',
              type: 'select',
              required: true,
              defaultValue: 'lifetime',
              options: [
                { label: 'Lifetime Access', value: 'lifetime' },
                { label: 'Time-Limited Access', value: 'time-limited' },
                { label: 'Batch-Based Access', value: 'batch' },
                { label: 'Subscription-Based Access', value: 'subscription' },
              ],
            },
            {
              name: 'accessDurationDays',
              type: 'number',
              min: 1,
              admin: {
                condition: (data) => data?.accessModel === 'time-limited',
                description: 'Number of days a student retains access after enrollment.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'dripEnabled',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'requireSequentialCompletion',
                  type: 'checkbox',
                  defaultValue: false,
                },
              ],
            },
            {
              name: 'maxEnrollments',
              type: 'number',
              min: 1,
              admin: {
                description: 'Leave empty for unlimited enrollments.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'courseType',
      type: 'select',
      required: true,
      defaultValue: 'recorded',
      options: [
        { label: 'Recorded', value: 'recorded' },
        { label: 'Live', value: 'live' },
        { label: 'Hybrid', value: 'hybrid' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'difficultyLevel',
      type: 'select',
      defaultValue: 'all-levels',
      options: [
        { label: 'All Levels', value: 'all-levels' },
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'language',
      type: 'select',
      defaultValue: DEFAULT_LOCALE,
      options: LOCALE_SELECT_OPTIONS,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'estimatedDurationMinutes',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'instructors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: {
        role: { in: ['admin', 'instructor'] },
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
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
