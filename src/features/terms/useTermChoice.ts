import { useMemo, useState } from 'react'

import { termInProgress } from './current'
import type { AcademicTerm } from './types'

/**
 * Which semester a page is showing: the one the visitor picked, else the one
 * in progress, else the most recent the institute defined (`terms` arrive
 * newest first). Shared by every page that reads one semester at a time, so
 * they all open on the same one.
 */
export function useTermChoice(terms: AcademicTerm[]) {
  const fallback = useMemo(() => termInProgress(terms) ?? terms[0] ?? null, [terms])
  const [selected, setSelected] = useState<string | null>(null)

  const active = terms.find((term) => term.code === selected) ?? fallback

  return { active, select: setSelected }
}
