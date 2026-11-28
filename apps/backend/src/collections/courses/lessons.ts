import type {
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from 'payload'
import { slugField } from 'payload'

import { adminOrPublishedStatus, isAdmin, isAdminOrInstructor } from '../../access'
import { defaultLexical } from '../../fields/defaultLexical'
import {
  deleteLessonMeetEvent,
  isGoogleCalendarConfigured,
  syncLessonMeetEvent,
} from '../../lib/google/calendar'
import type { Lesson } from '../../payload-types'

const setPublishedAt: CollectionBeforeChangeHook<Lesson> = ({ data }) => {
  if (data?._status === 'published' && !data.publishedAt) {
    return {
      ...data,
      publishedAt: new Date().toISOString(),
    }
  }
  return data
}

const syncGoogleMeetOnSave: CollectionBeforeChangeHook<Lesson> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data || req.context?.skipGoogleMeetSync) return data

  const isAutosave = req.query?.autosave === 'true'
  if (isAutosave) return data

  const lessonType = data.lessonType ?? originalDoc?.lessonType
  if (lessonType !== 'live') return data

  const liveSession = {
    ...(originalDoc?.liveSession ?? {}),
    ...(data.liveSession ?? {}),
  }

  const autoGenerate = liveSession.autoGenerateMeet ?? true
  const googleEventId = liveSession.googleEventId ?? originalDoc?.liveSession?.googleEventId

  if (!autoGenerate && liveSession.status !== 'cancelled') {
    return data
  }

  let settings = null
  try {
    settings = await req.payload.findGlobal({
      slug: 'google-calendar-settings',
      overrideAccess: true,
      req,
    })
  } catch {
    settings = null
  }

  if (!isGoogleCalendarConfigured(settings)) {
    return data
  }

  if (liveSession.status === 'cancelled' && googleEventId) {
    try {
      await syncLessonMeetEvent({
        payload: req.payload,
        settings,
        title: data.title || originalDoc?.title || 'Live Session',
        scheduledAt:
          liveSession.scheduledAt ||
          originalDoc?.liveSession?.scheduledAt ||
          new Date().toISOString(),
        calendarId: liveSession.calendarId,
        googleEventId,
        status: 'cancelled',
      })
      return {
        ...data,
        liveSession: {
          ...liveSession,
          googleEventId: null,
          googleCalendarLink: null,
          googleConferenceId: null,
          lastSyncedAt: new Date().toISOString(),
          syncError: null,
        },
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel Google Calendar event.'
      return {
        ...data,
        liveSession: {
          ...liveSession,
          syncError: message,
        },
      }
    }
  }

  const scheduledAt = liveSession.scheduledAt || originalDoc?.liveSession?.scheduledAt
  if (!scheduledAt) {
    return data
  }

  const attendeeEmails = (liveSession.attendeeEmails || [])
    .map((item) => item?.email)
    .filter((email): email is string => Boolean(email))

  try {
    const result = await syncLessonMeetEvent({
      payload: req.payload,
      settings,
      title: data.title || originalDoc?.title || 'Live Session',
      description: data.description ?? originalDoc?.description,
      scheduledAt,
      durationMinutes: data.durationMinutes ?? originalDoc?.durationMinutes,
      timeZone: liveSession.timeZone,
      calendarId: liveSession.calendarId,
      attendeeEmails,
      googleEventId,
      status: liveSession.status,
    })

    return {
      ...data,
      liveMeetingUrl: result.meetUrl || data.liveMeetingUrl || originalDoc?.liveMeetingUrl,
      liveSession: {
        ...liveSession,
        googleEventId: result.googleEventId ?? googleEventId,
        googleCalendarLink: result.googleCalendarLink ?? liveSession.googleCalendarLink,
        googleConferenceId: result.googleConferenceId ?? liveSession.googleConferenceId,
        lastSyncedAt: result.lastSyncedAt,
        syncError: null,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to sync Google Meet event.'
    req.payload.logger.warn({ err, msg: 'Google Calendar sync failed during lesson save' })
    return {
      ...data,
      liveSession: {
        ...liveSession,
        syncError: message,
      },
    }
  }
}

const cleanupGoogleMeetOnDelete: CollectionAfterDeleteHook<Lesson> = async ({ doc, req }) => {
  if (doc.lessonType !== 'live' || !doc.liveSession?.googleEventId) return

  try {
    const settings = await req.payload.findGlobal({
      slug: 'google-calendar-settings',
      overrideAccess: true,
      req,
    })
    if (!isGoogleCalendarConfigured(settings)) return

    await deleteLessonMeetEvent({
      payload: req.payload,
      settings,
      googleEventId: doc.liveSession.googleEventId,
      calendarId: doc.liveSession.calendarId,
    })
  } catch (err) {
    req.payload.logger.warn({ err, msg: 'Failed to delete Google Calendar event for lesson' })
  }
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
    beforeChange: [setPublishedAt, syncGoogleMeetOnSave],
    afterDelete: [cleanupGoogleMeetOnDelete],
  },
  endpoints: [
    {
      path: '/:id/google-meet',
      method: 'post',
      handler: async (req) => {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
          return Response.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const id = req.routeParams?.id as string | undefined
        if (!id) {
          return Response.json({ error: 'Lesson ID is required' }, { status: 400 })
        }

        const lesson = await req.payload.findByID({
          collection: 'lessons',
          id,
          depth: 0,
          req,
        })

        if (!lesson) {
          return Response.json({ error: 'Lesson not found' }, { status: 404 })
        }

        if (lesson.lessonType !== 'live') {
          return Response.json(
            { error: 'Google Meet links can only be generated for live lessons.' },
            { status: 400 },
          )
        }

        if (!lesson.liveSession?.scheduledAt) {
          return Response.json(
            { error: 'Please set liveSession.scheduledAt before generating a meeting.' },
            { status: 400 },
          )
        }

        const settings = await req.payload.findGlobal({
          slug: 'google-calendar-settings',
          overrideAccess: true,
          req,
        })

        if (!isGoogleCalendarConfigured(settings)) {
          return Response.json(
            { error: 'Google Calendar credentials are not configured.' },
            { status: 400 },
          )
        }

        const attendeeEmails = (lesson.liveSession.attendeeEmails || [])
          .map((item) => item?.email)
          .filter((email): email is string => Boolean(email))

        const result = await syncLessonMeetEvent({
          payload: req.payload,
          settings,
          title: lesson.title,
          description: lesson.description,
          scheduledAt: lesson.liveSession.scheduledAt,
          durationMinutes: lesson.durationMinutes,
          timeZone: lesson.liveSession.timeZone,
          calendarId: lesson.liveSession.calendarId,
          attendeeEmails,
          googleEventId: lesson.liveSession.googleEventId,
          status: lesson.liveSession.status,
        })

        const updated = await req.payload.update({
          collection: 'lessons',
          id,
          req,
          context: { skipGoogleMeetSync: true },
          data: {
            liveMeetingUrl: result.meetUrl || lesson.liveMeetingUrl,
            liveSession: {
              ...lesson.liveSession,
              googleEventId: result.googleEventId ?? null,
              googleCalendarLink: result.googleCalendarLink ?? null,
              googleConferenceId: result.googleConferenceId ?? null,
              lastSyncedAt: result.lastSyncedAt,
              syncError: null,
            },
          },
        })

        return Response.json({
          liveMeetingUrl: updated.liveMeetingUrl,
          liveSession: updated.liveSession,
          doc: updated,
        })
      },
    },
  ],
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
      localized: true,
    },
    slugField({
      useAsSlug: 'title',
    }),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: defaultLexical,
      localized: true,
    },
    {
      name: 'videoSource',
      type: 'select',
      defaultValue: 'upload',
      options: [
        { label: 'Upload Video', value: 'upload' },
        { label: 'External Video URL', value: 'url' },
      ],
      admin: {
        condition: (data) => data?.lessonType === 'video',
      },
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'videos',
      admin: {
        condition: (data) => data?.lessonType === 'video' && data?.videoSource !== 'url',
        description: 'Recorded lesson video uploaded by instructor to private S3 storage.',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.lessonType === 'video' && data?.videoSource === 'url',
        description: 'External video URL or stream reference for recorded lessons.',
      },
    },
    {
      name: 'liveMeetingUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.lessonType === 'live',
        description:
          'Google Meet join URL (auto-generated via Google Calendar API when Live Session scheduling is saved).',
      },
    },
    {
      name: 'liveSession',
      type: 'group',
      label: 'Live Session & Google Calendar',
      admin: {
        condition: (data) => data?.lessonType === 'live',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'autoGenerateMeet',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Automatically create/update a Google Calendar event and Meet link when saving.',
              },
            },
            {
              name: 'status',
              type: 'select',
              defaultValue: 'scheduled',
              options: [
                { label: 'Scheduled', value: 'scheduled' },
                { label: 'Live', value: 'live' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'scheduledAt',
              type: 'date',
              label: 'Start Date & Time',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
            {
              name: 'timeZone',
              type: 'text',
              defaultValue: 'UTC',
              admin: {
                description: 'IANA timezone (e.g. UTC, Asia/Kolkata, America/New_York).',
              },
            },
            {
              name: 'calendarId',
              type: 'text',
              admin: {
                description: 'Optional Google Calendar ID override (defaults to settings / primary).',
              },
            },
          ],
        },
        {
          name: 'attendeeEmails',
          type: 'array',
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'googleEventId',
              type: 'text',
              admin: { readOnly: true },
            },
            {
              name: 'googleConferenceId',
              type: 'text',
              admin: { readOnly: true },
            },
          ],
        },
        {
          name: 'googleCalendarLink',
          type: 'text',
          admin: { readOnly: true },
        },
        {
          name: 'lastSyncedAt',
          type: 'date',
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'syncError',
          type: 'textarea',
          admin: { readOnly: true },
        },
      ],
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
