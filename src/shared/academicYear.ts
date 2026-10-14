/** The month (1–12) a new academic year starts: 1 September, with the autumn term. */
const YEAR_STARTS_IN = 9

/**
 * The academic year a date falls in — "2026 / 2027" from 1 September 2026 to
 * 31 August 2027 — so the label on the home page turns over by itself.
 */
export function academicYear(date = new Date()) {
  const from = date.getMonth() + 1 >= YEAR_STARTS_IN ? date.getFullYear() : date.getFullYear() - 1
  return { from, to: from + 1 }
}
