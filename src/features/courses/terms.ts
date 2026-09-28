import type { TranslationKey } from '../../app/preferences'
import type { CourseRecord } from './types'

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

/**
 * 학기 — 'YYYY-1' (봄) or 'YYYY-2' (가을), mirroring `termFromDate` on the
 * API. A course saved before the field existed has no term stored, so the
 * start date stands in for it and the semester picker still lists it.
 */
export function termFromDate(date: string | null | undefined): string | null {
  if (!date) {
    return null
  }

  const [year, month] = date.split('-').map(Number)

  if (!year || !month) {
    return null
  }

  if (month >= 3 && month <= 8) {
    return `${year}-1`
  }

  return month >= 9 ? `${year}-2` : `${year - 1}-2`
}

export const courseTerm = (course: CourseRecord): string | null => course.term ?? termFromDate(course.startDate)

/** Newest first — an academic calendar is read from the current semester back. */
export function listTerms(courses: readonly CourseRecord[] | undefined): string[] {
  const terms = new Set<string>()

  for (const course of courses ?? []) {
    const term = courseTerm(course)

    if (term) {
      terms.add(term)
    }
  }

  return [...terms].sort().reverse()
}

export function termLabel(term: string | null, t: Translate): string {
  if (!term) {
    return t('terms.unset')
  }

  const [year, suffix] = term.split('-')

  if (suffix?.startsWith('b')) {
    return t('terms.breakOf', { year })
  }

  return t(suffix === '1' ? 'terms.spring' : 'terms.autumn', { year })
}

/** The semester that contains today, or the most recent one on record. */
export function currentTerm(courses: readonly CourseRecord[] | undefined): string | null {
  const terms = listTerms(courses)

  if (terms.length === 0) {
    return null
  }

  const today = termFromDate(new Date().toISOString().slice(0, 10))

  return today && terms.includes(today) ? today : terms[0]
}
