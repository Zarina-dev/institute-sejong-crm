import type { TranslationKey } from '../../app/preferences'
import type { CourseRecord } from './types'

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

/**
 * 학기 — 'YYYY-1' (봄) or 'YYYY-2' (가을), mirroring `termFromDate` on the
 * API. A course saved before the field existed has no term stored, so the
 * start date stands in for it and the semester picker still lists it.
 */
function termFromDate(date: string | null | undefined): string | null {
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

/**
 * A name from a semester *code* alone — for codes whose term is not at hand
 * (or no longer defined). Same wording as termDisplayName; a break's season
 * needs its dates, so from a code it is just "방학".
 */
export function termLabel(term: string | null, t: Translate): string {
  if (!term) {
    return t('terms.unset')
  }

  const [year, suffix] = term.split('-')

  if (suffix?.startsWith('b')) {
    return t('terms.breakOf', { year })
  }

  return t(suffix === '1' ? 'terms.display.first' : 'terms.display.second', { year })
}
