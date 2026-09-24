/** Date helpers for the week-by-week schedule view. All dates are local ISO YYYY-MM-DD. */

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (result.getDay() + 6) % 7 // Monday = 0
  result.setDate(result.getDate() - offset)
  return result
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function weekRange(monday: Date): { from: string; to: string } {
  return { from: toIsoDate(monday), to: toIsoDate(addDays(monday, 6)) }
}

/** "14 – 20 Sep 2026", localized; the month/year appear once when they match. */
export function formatWeekLabel(monday: Date, language: string): string {
  const sunday = addDays(monday, 6)
  const fmt = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', year: 'numeric' })
  // formatRange is in every current browser but not in the ES2020 lib typings.
  const withRange = fmt as Intl.DateTimeFormat & { formatRange?: (a: Date, b: Date) => string }
  return withRange.formatRange ? withRange.formatRange(monday, sunday) : `${fmt.format(monday)} – ${fmt.format(sunday)}`
}

/** Whole-month range (1st to last day), for the month calendar. */
export function monthRange(year: number, month: number): { from: string; to: string } {
  return { from: toIsoDate(new Date(year, month, 1)), to: toIsoDate(new Date(year, month + 1, 0)) }
}
