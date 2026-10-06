import type { TranslateFn } from '../../app/preferences'
import type { AcademicTerm } from './types'

type Named = Pick<AcademicTerm, 'year' | 'kind' | 'startDate'>

/**
 * 여름방학 or 겨울방학. The data model has one kind of break — the institute
 * may have one or several a year — so the season is read off when it starts:
 * a break that begins in spring or summer is the summer one.
 */
export function breakSeason(term: Pick<AcademicTerm, 'startDate'>): 'summer' | 'winter' {
  const month = Number(term.startDate.slice(5, 7))

  return month >= 4 && month <= 9 ? 'summer' : 'winter'
}

/**
 * "2026년 1학기", "2026년 여름방학" — the one way a semester is named
 * wherever a visitor or an admin picks one. The optional name typed in
 * 학기 관리 is a memo for the office and is shown beside this in the admin
 * screens, not instead of it, so the site reads the same everywhere.
 */
export function termDisplayName(term: Named, t: TranslateFn): string {
  if (term.kind === 'first') {
    return t('terms.display.first', { year: term.year })
  }

  if (term.kind === 'second') {
    return t('terms.display.second', { year: term.year })
  }

  return t(breakSeason(term) === 'summer' ? 'terms.display.summer' : 'terms.display.winter', { year: term.year })
}

/** The memo, when there is one worth showing next to the standard name. */
export function termMemo(term: Pick<AcademicTerm, 'name' | 'code'>): string | null {
  const memo = term.name?.trim()

  return memo && memo !== term.code ? memo : null
}
