import type { GlobalConfig } from 'payload'

import { isAdmin } from '../access'

export const GoogleCalendarSettings: GlobalConfig = {
  slug: 'google-calendar-settings',
  label: 'Google Calendar & Meet',
  admin: {
    group: 'Integrations',
    description:
      'Configure Google Calendar OAuth2 / Service Account integration for automatic Google Meet link generation on live lessons.',
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Enable Google Calendar sync for live lessons. Credentials can be connected via /api/google/oauth/url or GOOGLE_* environment variables.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'calendarId',
          type: 'text',
          defaultValue: 'primary',
          admin: {
            description: 'Target Google Calendar ID (defaults to "primary").',
          },
        },
        {
          name: 'defaultTimeZone',
          type: 'text',
          defaultValue: 'UTC',
          admin: {
            description: 'Default IANA timezone (e.g. UTC, Asia/Kolkata, America/New_York).',
          },
        },
      ],
    },
    {
      name: 'connectedEmail',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Google account connected via OAuth2.',
      },
    },
    {
      name: 'refreshToken',
      type: 'text',
      admin: {
        description:
          'OAuth2 refresh token (automatically populated by /api/google/oauth/callback or overridden by GOOGLE_REFRESH_TOKEN).',
      },
    },
  ],
}
