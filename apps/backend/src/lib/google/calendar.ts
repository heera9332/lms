import { getEnv } from '@lms/env'
import crypto from 'crypto'
import { google, type calendar_v3 } from 'googleapis'
import type { Payload } from 'payload'

import type { GoogleCalendarSetting } from '../../payload-types'

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
]

export type CalendarApiClient = {
  events: {
    insert: (
      params: calendar_v3.Params$Resource$Events$Insert,
    ) => Promise<{ data: calendar_v3.Schema$Event }>
    patch: (
      params: calendar_v3.Params$Resource$Events$Patch,
    ) => Promise<{ data: calendar_v3.Schema$Event }>
    delete: (params: calendar_v3.Params$Resource$Events$Delete) => Promise<unknown>
  }
}

export type CalendarClientFactory = (settings?: Partial<GoogleCalendarSetting> | null) => CalendarApiClient

export type SyncLessonMeetInput = {
  payload?: Payload
  settings?: Partial<GoogleCalendarSetting> | null
  title: string
  description?: string | null
  scheduledAt: string
  durationMinutes?: number | null
  timeZone?: string | null
  calendarId?: string | null
  attendeeEmails?: string[]
  googleEventId?: string | null
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled' | null
  clientFactory?: CalendarClientFactory
}

export type SyncLessonMeetResult = {
  synced: boolean
  cancelled?: boolean
  meetUrl?: string
  googleEventId?: string | null
  googleCalendarLink?: string | null
  googleConferenceId?: string | null
  lastSyncedAt?: string
}

function getOAuthRedirectUri(): string {
  const configured = getEnv('GOOGLE_REDIRECT_URI')
  if (configured) return configured
  const baseUrl = getEnv('SITE_URL') || getEnv('NEXT_PUBLIC_SERVER_URL', 'http://127.0.0.1:3000')
  return `${baseUrl.replace(/\/$/, '')}/api/google/oauth/callback`
}

export function getGoogleAuthMode(
  settings?: Partial<GoogleCalendarSetting> | null,
): 'service_account' | 'oauth2' | 'none' {
  const serviceEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = getEnv('GOOGLE_PRIVATE_KEY')
  if (serviceEmail && privateKey) {
    return 'service_account'
  }

  const clientId = getEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET')
  const refreshToken = getEnv('GOOGLE_REFRESH_TOKEN') || settings?.refreshToken || undefined
  if (clientId && clientSecret && refreshToken) {
    return 'oauth2'
  }

  return 'none'
}

export function isGoogleCalendarConfigured(
  settings?: Partial<GoogleCalendarSetting> | null,
): boolean {
  const mode = getGoogleAuthMode(settings)
  if (mode === 'none') return false
  if (settings && settings.enabled === false) {
    // Allow explicit env-only configurations when global hasn't been toggled off after setup,
    // or require enabled=true when configured via global refreshToken.
    const hasEnvCredentials = Boolean(
      (getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL') && getEnv('GOOGLE_PRIVATE_KEY')) ||
        (getEnv('GOOGLE_CLIENT_ID') &&
          getEnv('GOOGLE_CLIENT_SECRET') &&
          getEnv('GOOGLE_REFRESH_TOKEN')),
    )
    return hasEnvCredentials
  }
  return true
}

export function createGoogleOAuthClient() {
  const clientId = getEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured for OAuth2.')
  }
  return new google.auth.OAuth2(clientId, clientSecret, getOAuthRedirectUri())
}

export function createGoogleOAuthUrl(state?: string): string {
  const oauth2Client = createGoogleOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: CALENDAR_SCOPES,
    ...(state ? { state } : {}),
  })
}

export async function exchangeGoogleOAuthCode(args: {
  code: string
  payload: Payload
}): Promise<{ email?: string; hasRefreshToken: boolean }> {
  const { code, payload } = args
  const oauth2Client = createGoogleOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  let email: string | undefined
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    email = userInfo.data.email || undefined
  } catch {
    // Userinfo lookup is optional
  }

  const current = await payload.findGlobal({
    slug: 'google-calendar-settings',
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'google-calendar-settings',
    overrideAccess: true,
    data: {
      enabled: true,
      ...(email ? { connectedEmail: email } : {}),
      ...(tokens.refresh_token
        ? { refreshToken: tokens.refresh_token }
        : current?.refreshToken
          ? { refreshToken: current.refreshToken }
          : {}),
    },
  })

  return {
    email,
    hasRefreshToken: Boolean(tokens.refresh_token || current?.refreshToken),
  }
}

export function createGoogleCalendarClient(
  settings?: Partial<GoogleCalendarSetting> | null,
): CalendarApiClient {
  const mode = getGoogleAuthMode(settings)

  if (mode === 'service_account') {
    const email = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL', '')
    const rawKey = getEnv('GOOGLE_PRIVATE_KEY', '')
    const privateKey = rawKey.replace(/\\n/g, '\n')
    const subject = getEnv('GOOGLE_IMPERSONATE_EMAIL')

    const jwt = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
      ...(subject ? { subject } : {}),
    })

    return google.calendar({ version: 'v3', auth: jwt })
  }

  if (mode === 'oauth2') {
    const oauth2Client = createGoogleOAuthClient()
    const refreshToken = getEnv('GOOGLE_REFRESH_TOKEN') || settings?.refreshToken || ''
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    return google.calendar({ version: 'v3', auth: oauth2Client })
  }

  throw new Error(
    'Google Calendar is not configured. Provide OAuth2 (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) or Service Account credentials.',
  )
}

export function extractMeetUrl(event: calendar_v3.Schema$Event): string | undefined {
  if (event.hangoutLink) return event.hangoutLink
  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === 'video' && Boolean(entry.uri),
  )
  return videoEntry?.uri || undefined
}

export function buildCalendarEventBody(args: {
  title: string
  description?: string | null
  scheduledAt: string
  durationMinutes?: number | null
  timeZone?: string | null
  attendeeEmails?: string[]
  includeConferenceRequest?: boolean
}): calendar_v3.Schema$Event {
  const start = new Date(args.scheduledAt)
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid live session scheduledAt date: "${args.scheduledAt}"`)
  }

  const duration = args.durationMinutes && args.durationMinutes > 0 ? args.durationMinutes : 60
  const end = new Date(start.getTime() + duration * 60_000)
  const timeZone = args.timeZone || 'UTC'
  const attendees = (args.attendeeEmails || [])
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }))

  return {
    summary: args.title,
    ...(args.description ? { description: args.description } : {}),
    start: {
      dateTime: start.toISOString(),
      timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone,
    },
    ...(attendees.length > 0 ? { attendees } : {}),
    ...(args.includeConferenceRequest
      ? {
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
        }
      : {}),
  }
}

async function resolveSettings(
  payload?: Payload,
  provided?: Partial<GoogleCalendarSetting> | null,
): Promise<Partial<GoogleCalendarSetting> | null> {
  if (provided !== undefined) return provided
  if (!payload) return null
  try {
    return await payload.findGlobal({
      slug: 'google-calendar-settings',
      overrideAccess: true,
    })
  } catch {
    return null
  }
}

export async function syncLessonMeetEvent(
  input: SyncLessonMeetInput,
): Promise<SyncLessonMeetResult> {
  const settings = await resolveSettings(input.payload, input.settings)
  const calendarId =
    input.calendarId || settings?.calendarId || getEnv('GOOGLE_CALENDAR_ID', 'primary')
  const timeZone = input.timeZone || settings?.defaultTimeZone || 'UTC'

  const calendar = input.clientFactory
    ? input.clientFactory(settings)
    : createGoogleCalendarClient(settings)

  if (input.status === 'cancelled') {
    if (input.googleEventId) {
      await deleteLessonMeetEvent({
        payload: input.payload,
        settings,
        googleEventId: input.googleEventId,
        calendarId,
        clientFactory: input.clientFactory,
      })
    }
    return {
      synced: true,
      cancelled: true,
      googleEventId: null,
      googleCalendarLink: null,
      googleConferenceId: null,
      lastSyncedAt: new Date().toISOString(),
    }
  }

  const attendees = (input.attendeeEmails || []).filter(Boolean)
  const sendUpdates = attendees.length > 0 ? 'all' : 'none'

  if (input.googleEventId) {
    const requestBody = buildCalendarEventBody({
      title: input.title,
      description: input.description,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      timeZone,
      attendeeEmails: attendees,
      includeConferenceRequest: false,
    })

    const response = await calendar.events.patch({
      calendarId,
      eventId: input.googleEventId,
      conferenceDataVersion: 1,
      sendUpdates,
      requestBody,
    })

    return {
      synced: true,
      meetUrl: extractMeetUrl(response.data),
      googleEventId: response.data.id || input.googleEventId,
      googleCalendarLink: response.data.htmlLink || null,
      googleConferenceId: response.data.conferenceData?.conferenceId || null,
      lastSyncedAt: new Date().toISOString(),
    }
  }

  const requestBody = buildCalendarEventBody({
    title: input.title,
    description: input.description,
    scheduledAt: input.scheduledAt,
    durationMinutes: input.durationMinutes,
    timeZone,
    attendeeEmails: attendees,
    includeConferenceRequest: true,
  })

  const response = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates,
    requestBody,
  })

  return {
    synced: true,
    meetUrl: extractMeetUrl(response.data),
    googleEventId: response.data.id || null,
    googleCalendarLink: response.data.htmlLink || null,
    googleConferenceId: response.data.conferenceData?.conferenceId || null,
    lastSyncedAt: new Date().toISOString(),
  }
}

export async function deleteLessonMeetEvent(args: {
  payload?: Payload
  settings?: Partial<GoogleCalendarSetting> | null
  googleEventId: string
  calendarId?: string | null
  clientFactory?: CalendarClientFactory
}): Promise<void> {
  const settings = await resolveSettings(args.payload, args.settings)
  const calendarId =
    args.calendarId || settings?.calendarId || getEnv('GOOGLE_CALENDAR_ID', 'primary')
  const calendar = args.clientFactory
    ? args.clientFactory(settings)
    : createGoogleCalendarClient(settings)

  try {
    await calendar.events.delete({
      calendarId,
      eventId: args.googleEventId,
    })
  } catch (err) {
    const status = (err as { code?: number; status?: number } | undefined)?.code ??
      (err as { status?: number } | undefined)?.status
    if (status === 404 || status === 410) return
    throw err
  }
}
