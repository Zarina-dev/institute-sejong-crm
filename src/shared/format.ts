import type { Language } from '../i18n'

const dateFormatters = new Map<Language, Intl.DateTimeFormat>()

/** ISO string → localized long date ("2026년 9월 15일", "15 сентября 2026 г."). */
export function formatDate(value: string | Date | null | undefined, language: Language = 'en'): string {
  if (!value) {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  let formatter = dateFormatters.get(language)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, { year: 'numeric', month: 'long', day: 'numeric' })
    dateFormatters.set(language, formatter)
  }

  return formatter.format(date)
}

export function formatFileSize(size?: number | null): string {
  if (!size) {
    return '—'
  }

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "3 hours ago" in the UI language; anything under a minute is `justNow`. */
export function formatRelativeTime(value: string | Date, language: Language, justNow: string): string {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)

  if (Math.abs(seconds) < 60) {
    return justNow
  }

  const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit)
    }
  }

  return justNow
}
