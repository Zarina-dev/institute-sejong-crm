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

/**
 * The home page's "next classes" window: today and the 13 days after it.
 * Shared with the prefetch in main.tsx, which must ask for exactly this range.
 */
export const upcomingRange = (days = 14) => ({ from: toIsoDate(new Date()), to: toIsoDate(addDays(new Date(), days - 1)) })
