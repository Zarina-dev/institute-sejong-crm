import type { AcademicTerm } from './types'

const today = () => new Date().toISOString().slice(0, 10)

/** The semester today falls in, by the institute's own dates. */
export const termInProgress = (terms: AcademicTerm[], on = today()) =>
  terms.find((term) => term.startDate <= on && on <= term.endDate) ?? null
