import type { AcademicTerm } from './types'
import { toIsoDate } from '../courses/week'

// Today on the visitor's own calendar, not UTC (in Osh UTC lags until 06:00).
const today = () => toIsoDate(new Date())

/** The semester today falls in, by the institute's own dates. */
export const termInProgress = (terms: AcademicTerm[], on = today()) => terms.find((term) => term.startDate <= on && on <= term.endDate) ?? null
