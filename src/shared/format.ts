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

const rangeFormatters = new Map<Language, Intl.DateTimeFormat>()

/**
 * "2026년 9월 1일 ~ 12월 20일" / "Sep 1 – Dec 20, 2026": the shared year is
 * printed once. One side missing → "from …" / "until …" via the ~ form; both
 * missing → null so the caller can show its own placeholder.
 */
export function formatDateRange(start: string | null | undefined, end: string | null | undefined, language: Language = 'en'): string | null {
  const from = start ? new Date(`${start}T00:00:00`) : null
  const to = end ? new Date(`${end}T00:00:00`) : null

  if (!from && !to) {
    return null
  }

  let formatter = rangeFormatters.get(language)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, { year: 'numeric', month: 'short', day: 'numeric' })
    rangeFormatters.set(language, formatter)
  }

  if (from && to) {
    // formatRange is ES2021; the lib target is older, so the type is widened by hand.
    return (formatter as Intl.DateTimeFormat & { formatRange(a: Date, b: Date): string }).formatRange(from, to)
  }

  return from ? `${formatter.format(from)} ~` : `~ ${formatter.format(to as Date)}`
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
