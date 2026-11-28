/**
 * Reads an environment variable with an optional typed default fallback.
 * Empty strings (`""`) are treated as unset.
 *
 * @param {string} name
 * @param {string | number | boolean} [defaultValue]
 * @returns {string | number | boolean | undefined}
 */
export function getEnv(name, defaultValue) {
  const raw = process.env[name]

  if (raw === undefined || raw === '') {
    return defaultValue
  }

  if (typeof defaultValue === 'number') {
    const parsed = Number(raw)
    return Number.isNaN(parsed) ? defaultValue : parsed
  }

  if (typeof defaultValue === 'boolean') {
    const normalized = raw.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
    return defaultValue
  }

  return raw
}
