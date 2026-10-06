import { useCallback, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import { termInProgress } from './current'
import type { AcademicTerm } from './types'

/**
 * Where a choice is remembered: per page, and the admin apart from the site.
 * Each page opens on the semester in progress the first time it is entered,
 * and on the visitor's own choice when they come back to it — a semester
 * picked on 강좌 안내 is not carried to 문화 강좌, where it may well be empty.
 */
type Scope = 'site' | 'admin'

const storageKey = (scope: Scope, page: string) => `institut-term:${scope}:${page}`

// sessionStorage can be unavailable (private mode, blocked storage); a
// forgotten choice is harmless, so failures are ignored.
function readRemembered(scope: Scope, page: string) {
  try {
    return window.sessionStorage.getItem(storageKey(scope, page))
  } catch {
    return null
  }
}

function remember(scope: Scope, page: string, code: string) {
  try {
    window.sessionStorage.setItem(storageKey(scope, page), code)
  } catch {
    /* not remembered — the page still works */
  }
}

/**
 * Which semester a page is showing. In order:
 *
 * 1. `?term=` in the URL — so the back button, a reload and a shared link
 *    all come back to the same semester;
 * 2. the semester last picked on this page in this tab — coming back to it
 *    through the menu does not snap back to the current one;
 * 3. the semester in progress — what a first-time visitor should see without
 *    choosing anything;
 * 4. the most recent one defined (`terms` arrive newest first).
 *
 * A remembered or linked semester that no longer exists is simply skipped.
 */
export function useTermChoice(terms: AcademicTerm[], { scope = 'site' }: { scope?: Scope } = {}) {
  const [params, setParams] = useSearchParams()
  const page = useLocation().pathname
  // Read on every render, not kept in state: 강좌 안내 and 문화 강좌 are one
  // component on two routes, and state would carry one page's choice into
  // the other. Selecting re-renders through the URL change.
  const remembered = readRemembered(scope, page)

  const fallback = useMemo(() => termInProgress(terms) ?? terms[0] ?? null, [terms])
  const linked = params.get('term')

  const active =
    terms.find((term) => term.code === linked) ?? terms.find((term) => term.code === remembered) ?? fallback

  const select = useCallback(
    (code: string) => {
      remember(scope, page, code)
      // A filter, not a destination: replace the entry rather than stacking
      // one per change in the history.
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          next.set('term', code)
          return next
        },
        { replace: true },
      )
    },
    [page, scope, setParams],
  )

  return { active, select }
}
