import { describe, expect, it, vi } from 'vitest'

import {
  buildCalendarEventBody,
  syncLessonMeetEvent,
  type CalendarApiClient,
} from '@/lib/google/calendar'

describe('Google Meet & Calendar integration', () => {
  it('builds a calendar event body with hangoutsMeet conferenceData and computed end time', () => {
    const body = buildCalendarEventBody({
      title: 'Live React Workshop',
      description: 'Deep dive into hooks',
      scheduledAt: '2026-12-01T10:00:00.000Z',
      durationMinutes: 90,
      timeZone: 'Asia/Kolkata',
      attendeeEmails: ['student@example.com', '  '],
      includeConferenceRequest: true,
    })

    expect(body.summary).toBe('Live React Workshop')
    expect(body.start).toEqual({
      dateTime: '2026-12-01T10:00:00.000Z',
      timeZone: 'Asia/Kolkata',
    })
    expect(body.end).toEqual({
      dateTime: '2026-12-01T11:30:00.000Z',
      timeZone: 'Asia/Kolkata',
    })
    expect(body.attendees).toEqual([{ email: 'student@example.com' }])
    expect(body.conferenceData?.createRequest?.conferenceSolutionKey?.type).toBe('hangoutsMeet')
    expect(body.conferenceData?.createRequest?.requestId).toBeTruthy()
  })

  it('creates, updates, and cancels a Google Meet event via Google Calendar API client', async () => {
    const insert = vi.fn().mockResolvedValue({
      data: {
        id: 'evt_123',
        htmlLink: 'https://calendar.google.com/event?eid=evt_123',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
        conferenceData: { conferenceId: 'abc-defg-hij' },
      },
    })
    const patch = vi.fn().mockResolvedValue({
      data: {
        id: 'evt_123',
        htmlLink: 'https://calendar.google.com/event?eid=evt_123',
        conferenceData: {
          conferenceId: 'abc-defg-hij',
          entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/abc-defg-hij' }],
        },
      },
    })
    const del = vi.fn().mockResolvedValue({})

    const mockClient: CalendarApiClient = {
      events: { insert, patch, delete: del },
    }

    const created = await syncLessonMeetEvent({
      title: 'Intro Live Class',
      scheduledAt: '2026-12-01T10:00:00.000Z',
      durationMinutes: 60,
      attendeeEmails: ['alice@example.com'],
      settings: { calendarId: 'primary', defaultTimeZone: 'UTC', enabled: true },
      clientFactory: () => mockClient,
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all',
      }),
    )
    expect(created.meetUrl).toBe('https://meet.google.com/abc-defg-hij')
    expect(created.googleEventId).toBe('evt_123')
    expect(created.googleConferenceId).toBe('abc-defg-hij')

    const updated = await syncLessonMeetEvent({
      title: 'Intro Live Class (Updated)',
      scheduledAt: '2026-12-02T10:00:00.000Z',
      durationMinutes: 45,
      googleEventId: 'evt_123',
      settings: { calendarId: 'primary', defaultTimeZone: 'UTC', enabled: true },
      clientFactory: () => mockClient,
    })

    expect(patch).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'primary',
        eventId: 'evt_123',
        conferenceDataVersion: 1,
      }),
    )
    expect(updated.meetUrl).toBe('https://meet.google.com/abc-defg-hij')

    const cancelled = await syncLessonMeetEvent({
      title: 'Intro Live Class',
      scheduledAt: '2026-12-02T10:00:00.000Z',
      googleEventId: 'evt_123',
      status: 'cancelled',
      settings: { calendarId: 'primary', defaultTimeZone: 'UTC', enabled: true },
      clientFactory: () => mockClient,
    })

    expect(del).toHaveBeenCalledWith({
      calendarId: 'primary',
      eventId: 'evt_123',
    })
    expect(cancelled.cancelled).toBe(true)
    expect(cancelled.googleEventId).toBeNull()
  })
})
