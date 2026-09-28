/** 1학기 · 2학기 · 방학 (a year can have more than one break). */
export const TERM_KINDS = ['first', 'second', 'break'] as const
export type TermKind = (typeof TERM_KINDS)[number]

/**
 * 학기 — the institute decides when each one runs, so the dates come from
 * the API rather than from the calendar.
 */
export type AcademicTerm = {
  id: string
  /** '2026-1' · '2026-2' · '2026-b1' — the key a class stores. */
  code: string
  year: number
  kind: TermKind
  /** Optional name the institute uses. */
  name: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export type AcademicTermInput = {
  year: number
  kind: TermKind
  name?: string
  startDate: string
  endDate: string
}
