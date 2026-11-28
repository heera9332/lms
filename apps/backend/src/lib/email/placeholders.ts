export type EmailPlaceholderValue = string | number | boolean | null | undefined

export type EmailPlaceholderData = Record<string, EmailPlaceholderValue>

export const STANDARD_PLACEHOLDERS = [
  { token: '{site_title}', description: 'Site / store name from Email Settings' },
  { token: '{site_url}', description: 'Public site base URL' },
  { token: '{order_number}', description: 'Order ID or order number' },
  { token: '{order_date}', description: 'Formatted order date' },
  { token: '{order_status}', description: 'Current order status' },
  { token: '{order_total}', description: 'Formatted order total with currency' },
  { token: '{order_items_table}', description: 'HTML table of ordered items' },
  { token: '{customer_name}', description: 'Customer full name' },
  { token: '{customer_first_name}', description: 'Customer first name' },
  { token: '{customer_email}', description: 'Customer email address' },
  { token: '{customer_note}', description: 'Note attached to the order' },
  { token: '{billing_address}', description: 'Formatted billing address' },
  { token: '{shipping_address}', description: 'Formatted shipping address' },
  { token: '{user_login}', description: 'Account username or email' },
  { token: '{reset_url}', description: 'Password reset URL' },
] as const

const RAW_HTML_PLACEHOLDER_KEYS = new Set([
  'order_items_table',
  'billing_address_html',
  'shipping_address_html',
])

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Replaces `{key}` and `{{key}}` placeholders in a string.
 * Escapes interpolated values when rendering HTML unless the key is in `rawHtmlKeys`.
 */
export function replacePlaceholders(
  template: string,
  data: EmailPlaceholderData,
  options?: {
    escapeValues?: boolean
    rawHtmlKeys?: Set<string>
  },
): string {
  if (!template) return ''

  const escapeValues = options?.escapeValues ?? false
  const rawHtmlKeys = options?.rawHtmlKeys ?? RAW_HTML_PLACEHOLDER_KEYS

  return template.replace(/\{\{?\s*([a-zA-Z0-9_.-]+)\s*\}?\}/g, (match, key: string) => {
    if (!(key in data)) return match
    const raw = data[key]
    if (raw === null || raw === undefined) return ''
    const str = String(raw)
    if (escapeValues && !rawHtmlKeys.has(key)) {
      return escapeHtml(str)
    }
    return str
  })
}

export type OrderItemRow = {
  name: string
  quantity: number
  total: string
  sku?: string
}

export function buildOrderItemsTableHtml(items: OrderItemRow[], orderTotal?: string): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border:1px solid #e5e5e5;text-align:left;">
            ${escapeHtml(item.name)}${item.sku ? `<br/><small style="color:#737373;">SKU: ${escapeHtml(item.sku)}</small>` : ''}
          </td>
          <td style="padding:12px;border:1px solid #e5e5e5;text-align:center;">${item.quantity}</td>
          <td style="padding:12px;border:1px solid #e5e5e5;text-align:right;">${escapeHtml(item.total)}</td>
        </tr>`,
    )
    .join('')

  const footer = orderTotal
    ? `<tfoot>
        <tr>
          <th colspan="2" style="padding:12px;border:1px solid #e5e5e5;text-align:left;">Total</th>
          <td style="padding:12px;border:1px solid #e5e5e5;text-align:right;font-weight:700;">${escapeHtml(orderTotal)}</td>
        </tr>
      </tfoot>`
    : ''

  return `
    <table cellspacing="0" cellpadding="6" border="1" style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;margin:16px 0;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:12px;border:1px solid #e5e5e5;text-align:left;background:#f9fafb;">Product</th>
          <th style="padding:12px;border:1px solid #e5e5e5;text-align:center;background:#f9fafb;">Quantity</th>
          <th style="padding:12px;border:1px solid #e5e5e5;text-align:right;background:#f9fafb;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      ${footer}
    </table>
  `.trim()
}
