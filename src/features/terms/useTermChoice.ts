import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import { termInProgress } from './current'
import type { AcademicTerm } from './types'

/**
 * Where a choice is remembered: per page, and the admin apart from the site.
 * A semester picked on 강좌 안내 is not carried to 문화 강좌, where it may
 * well be empty.
 */
type Scope = 'site' | 'admin'

/**
 * Kept in memory only, on purpose. Moving around the site keeps each page's
 * choice — coming back to 강좌 안내 through the menu does not snap back —
 * but a reload, like a new visit, opens on the semester in progress. Nothing
 * goes in the URL or in storage, since either would survive the reload.
 */
const chosen = new Map<string, string>()

/**
 * Which semester a page is showing: the one picked on this page since the
 * site was loaded, otherwise the semester in progress, otherwise the most
 * recent one defined (`terms` arrive newest first). A choice whose semester
 * no longer exists is simply skipped.
 */
export function useTermChoice(terms: AcademicTerm[], { scope = 'site' }: { scope?: Scope } = {}) {
  const page = useLocation().pathname
  const key = `${scope}:${page}`
  // The choice lives outside React (it must outlast the page's unmount), so
  // picking one re-renders by hand.
  const [, rerender] = useReducer((count: number) => count + 1, 0)
  useDropLegacyParam()

  const fallback = useMemo(() => termInProgress(terms) ?? terms[0] ?? null, [terms])
  const remembered = chosen.get(key)
  const active = terms.find((term) => term.code === remembered) ?? fallback

  const select = useCallback(
    (code: string) => {
      chosen.set(key, code)
      rerender()
    },
    [key],
  )

  return { active, select }
}

/**
 * Links and bookmarks from before carry `?term=`; it no longer decides
 * anything, so it is taken out of the address rather than left to mislead.
 */
function useDropLegacyParam() {
  const [params, setParams] = useSearchParams()
  const legacy = params.has('term')

  useEffect(() => {
    if (legacy) {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.delete('term')
          return next
        },
        { replace: true },
      )
    }
  }, [legacy, setParams])
}
