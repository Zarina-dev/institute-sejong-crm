/**
 * 학기 — the institute decides when a semester runs, so its dates come from
 * the API rather than from the calendar.
 */
export type AcademicTerm = {
  id: string
  /** '2026-1' · '2026-2' — the key a course stores. */
  code: string
  year: number
  /** 1 = 1학기, 2 = 2학기. */
  half: number
  /** Optional name the institute uses. */
  name: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
}

export type AcademicTermInput = {
  year: number
  half: number
  name?: string
  startDate: string
  endDate: string
}
