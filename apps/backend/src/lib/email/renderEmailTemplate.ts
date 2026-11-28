import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { Payload } from 'payload'

type LexicalData = Parameters<typeof convertLexicalToHTML>[0]['data']

import type { EmailSetting, EmailTemplate, Media } from '../../payload-types'
import {
  escapeHtml,
  replacePlaceholders,
  type EmailPlaceholderData,
} from './placeholders'

export type RenderedEmail = {
  subject: string
  heading: string
  html: string
  text: string
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function resolveHeaderImageUrl(headerImage: EmailSetting['headerImage'], siteUrl: string): string | null {
  if (!headerImage || typeof headerImage !== 'object') return null
  const media = headerImage as Media
  if (!media.url) return null
  if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
    return media.url
  }
  return `${siteUrl.replace(/\/$/, '')}${media.url.startsWith('/') ? '' : '/'}${media.url}`
}

export function renderEmailTemplate(args: {
  template: Pick<EmailTemplate, 'subject' | 'heading' | 'body' | 'additionalContent' | 'emailType'>
  settings?: Partial<EmailSetting> | null
  data?: EmailPlaceholderData
}): RenderedEmail {
  const { template, settings, data = {} } = args

  const siteTitle =
    (typeof data.site_title === 'string' && data.site_title) ||
    settings?.siteTitle ||
    process.env.MAIL_FROM_NAME ||
    'LMS'

  const siteUrl =
    (typeof data.site_url === 'string' && data.site_url) ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'http://127.0.0.1:3000'

  const mergedData: EmailPlaceholderData = {
    site_title: siteTitle,
    site_url: siteUrl,
    ...data,
  }

  const subject = replacePlaceholders(template.subject, mergedData, { escapeValues: false })
  const heading = replacePlaceholders(template.heading, mergedData, { escapeValues: false })

  let rawBodyHtml = ''
  if (template.body && typeof template.body === 'object' && 'root' in template.body) {
    rawBodyHtml = convertLexicalToHTML({
      data: template.body as LexicalData,
      disableContainer: true,
    })
  }

  const bodyHtml = replacePlaceholders(rawBodyHtml, mergedData, { escapeValues: true })
  const additionalHtml = template.additionalContent
    ? `<p style="margin-top:16px;color:#636363;font-size:14px;">${replacePlaceholders(
        escapeHtml(template.additionalContent),
        mergedData,
        { escapeValues: true },
      ).replaceAll('\n', '<br/>')}</p>`
    : ''

  const footerText = replacePlaceholders(
    settings?.footerText || '{site_title} — Powered by Payload CMS',
    mergedData,
    { escapeValues: true },
  )

  const baseColor = settings?.baseColor || '#7f54b3'
  const backgroundColor = settings?.backgroundColor || '#f7f7f7'
  const bodyBackgroundColor = settings?.bodyBackgroundColor || '#ffffff'
  const bodyTextColor = settings?.bodyTextColor || '#3c3c3c'
  const headerImageUrl = resolveHeaderImageUrl(settings?.headerImage, siteUrl)

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${escapeHtml(backgroundColor)};font-family:'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif;color:${escapeHtml(bodyTextColor)};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${escapeHtml(backgroundColor)};padding:40px 16px;">
      <tr>
        <td align="center">
          ${
            headerImageUrl
              ? `<div style="margin-bottom:20px;"><img src="${escapeHtml(headerImageUrl)}" alt="${escapeHtml(siteTitle)}" style="max-height:64px;width:auto;" /></div>`
              : ''
          }
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:${escapeHtml(bodyBackgroundColor)};border:1px solid #dedede;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="background-color:${escapeHtml(baseColor)};padding:32px 40px;">
                <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:400;line-height:1.3;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px;font-size:15px;line-height:1.6;color:${escapeHtml(bodyTextColor)};">
                ${bodyHtml}
                ${additionalHtml}
              </td>
            </tr>
          </table>
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
            <tr>
              <td style="padding:24px 16px;text-align:center;font-size:12px;color:#8a8a8a;">
                ${footerText}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [heading, '', stripHtmlTags(bodyHtml), '', stripHtmlTags(additionalHtml), '', stripHtmlTags(footerText)]
    .filter((part, idx, arr) => !(part === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim()

  return {
    subject,
    heading,
    html,
    text,
  }
}

export async function sendTemplatedEmail(args: {
  payload: Payload
  slug: string
  to?: string | string[]
  data?: EmailPlaceholderData
}): Promise<{ sent: boolean; reason?: string }> {
  const { payload, slug, to, data } = args

  const { docs } = await payload.find({
    collection: 'email-templates',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    overrideAccess: true,
  })

  const template = docs[0]
  if (!template) {
    return { sent: false, reason: `Template "${slug}" not found` }
  }

  if (!template.enabled) {
    return { sent: false, reason: `Template "${slug}" is disabled` }
  }

  const settings = await payload.findGlobal({
    slug: 'email-settings',
    overrideAccess: true,
  })

  let recipients: string | string[] | undefined = to
  if (template.recipientType !== 'customer') {
    const configured = (template.recipients || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (configured.length > 0) {
      recipients = configured
    } else if (!recipients && (settings?.fromAddress || process.env.MAIL_FROM_ADDRESS)) {
      recipients = settings?.fromAddress || process.env.MAIL_FROM_ADDRESS
    }
  }

  if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
    return { sent: false, reason: `No recipients resolved for template "${slug}"` }
  }

  const rendered = renderEmailTemplate({
    template,
    settings,
    data,
  })

  const fromAddress = settings?.fromAddress || process.env.MAIL_FROM_ADDRESS
  const fromName = settings?.fromName || process.env.MAIL_FROM_NAME || 'LMS'

  await payload.sendEmail({
    to: recipients,
    ...(fromAddress ? { from: `${fromName} <${fromAddress}>` } : {}),
    subject: rendered.subject,
    text: rendered.text,
    ...(template.emailType === 'plain' ? {} : { html: rendered.html }),
  })

  return { sent: true }
}
