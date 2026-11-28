export const SUPPORTED_LOCALES = [
  { label: 'English', code: 'en' },
  { label: 'Hindi', code: 'hi' },
] as const

export const DEFAULT_LOCALE = 'en' as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['code']

export const LOCALE_SELECT_OPTIONS = SUPPORTED_LOCALES.map(({ label, code }) => ({
  label,
  value: code,
}))
