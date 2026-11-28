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
            },
            slugField({
              useAsSlug: 'title',
            }),
            {
              name: 'shortDescription',
              type: 'textarea',
            },
            {
              name: 'description',
              type: 'richText',
              editor: defaultLexical,
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
              type: 'array',
              admin: {
                initCollapsed: false,
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
                  name: 'isFreePreview',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'lessons',
                  type: 'array',
                  fields: [
                    {
                      name: 'title',
                      type: 'text',
                      required: true,
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
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'durationMinutes',
                          type: 'number',
                          min: 0,
                        },
                        {
                          name: 'isFreePreview',
                          type: 'checkbox',
                          defaultValue: false,
                        },
                      ],
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
                        condition: (_, siblingData) => siblingData?.lessonType === 'video',
                      },
                    },
                    {
                      name: 'resource',
                      type: 'upload',
                      relationTo: 'media',
                      admin: {
                        condition: (_, siblingData) =>
                          siblingData?.lessonType === 'pdf' ||
                          siblingData?.lessonType === 'resource',
                      },
                    },
                    {
                      name: 'externalUrl',
                      type: 'text',
                      admin: {
                        condition: (_, siblingData) => siblingData?.lessonType === 'external',
                      },
                    },
                  ],
                },
              ],
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
              type: 'row',
              admin: {
                condition: (data) => data?.pricingType === 'paid',
              },
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  min: 0,
                  admin: {
                    description: 'Monetary price in minor units (e.g. cents/paise).',
                  },
                },
                {
                  name: 'discountPrice',
                  type: 'number',
                  min: 0,
                },
                {
                  name: 'currency',
                  type: 'select',
                  defaultValue: 'USD',
                  options: [
                    { label: 'USD ($)', value: 'USD' },
                    { label: 'INR (₹)', value: 'INR' },
                    { label: 'EUR (€)', value: 'EUR' },
                    { label: 'GBP (£)', value: 'GBP' },
                  ],
                },
              ],
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
      type: 'text',
      defaultValue: 'en',
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
