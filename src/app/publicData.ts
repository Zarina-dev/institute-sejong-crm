import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

import { coursesQuery, timetableQuery } from '../features/courses/queries'
import { upcomingRange } from '../features/courses/week'
import { publishedNewsQuery } from '../features/news/queries'
import { homeTerm } from '../features/terms/current'
import { termsQuery } from '../features/terms/queries'
import { apiGet, setApiLanguage } from '../api/client'
import { getTimetable } from '../features/courses/api'
import { getPublishedNews } from '../features/news/api'
import { getTerms } from '../features/terms/api'
import type { CourseRecord, TimetableEntry } from '../features/courses/types'
import type { NewsPost } from '../features/news/types'
import type { AcademicTerm } from '../features/terms/types'
import { queryClient } from './queryClient'
import type { Language } from './preferences'

/**
 * Public data is kept in localStorage, so a returning visitor sees the last
 * pages at once while the (stale) queries revalidate in the background —
 * every API round trip is ~260 ms from Kyrgyzstan. Only what any visitor may
 * read is written: nothing from the admin panel ever lands in storage.
 * `__BUILD_ID__` changes with every build, so a cache written by older code
 * (different data shapes) is dropped rather than rendered.
 */
const MAX_AGE = 24 * 60 * 60_000

type Key = readonly unknown[]
const isPublicKey = ([scope, kind, filters]: Key) =>
  (scope === 'terms' && kind === undefined) ||
  (scope === 'news' && kind === 'published') ||
  scope === 'timetable' ||
  (scope === 'courses' && kind === 'list' && (filters as { publishedOnly?: boolean } | undefined)?.publishedOnly === true)

function createPersister() {
  try {
    return createSyncStoragePersister({ storage: window.localStorage, key: 'institut-query-cache', throttleTime: 1000 })
  } catch {
    return null // storage blocked: run without a persisted cache
  }
}

/** Puts the saved cache back (fast: synchronous storage) and keeps saving from now on. */
async function restoreCache() {
  const persister = createPersister()
  if (!persister) return

  const options = { queryClient, persister, maxAge: MAX_AGE, buster: __BUILD_ID__ }
  await persistQueryClientRestore(options).catch(() => {})
  persistQueryClientSubscribe({
    ...options,
    dehydrateOptions: { shouldDehydrateQuery: (query) => query.state.status === 'success' && isPublicKey(query.queryKey) },
  })
}

/** `GET /api/home`: each part exactly what its own route answers (backend/src/home/home.controller.ts). */
type HomeData = {
  terms: AcademicTerm[]
  news: NewsPost[]
  newsLimit: number
  term: string | null
  courses: CourseRecord[]
  range: { from: string; to: string }
  timetable: TimetableEntry[]
}

/**
 * Starts the home page's data now, in parallel with the dictionary and the
 * first render, instead of when HomePage mounts (after all code has loaded
 * and rendered) — and as one request: the server picks the semester and
 * answers terms, news, its courses and the timetable together, so the
 * courses no longer wait for the terms to come back first. Each part is
 * filed under the query its hook reads, so the hooks find it there and
 * other pages reuse it. A part the hook asks for differently (a visitor
 * whose calendar day is not Osh's) is simply fetched by the hook itself.
 */
function prefetchHome(language: Language) {
  if (window.location.pathname !== '/') return

  setApiLanguage(language) // the first render has not run PreferencesProvider yet
  const home = apiGet<HomeData>('/home')
  const range = upcomingRange()
  // The courses are filed first (callbacks run in the order they are added):
  // HomePage asks for them as soon as the terms below resolve.
  home.then(
    (data) => {
      if (data.term) queryClient.setQueryData(coursesQuery(true, { term: data.term }).queryKey, data.courses)
    },
    () => {},
  )
  // The queries are in flight from now on, answered by /home: a hook that
  // mounts before it is back waits for it rather than sending its own.
  // /home failing (an older API): each part is asked for on its own.
  void queryClient.prefetchQuery({ ...publishedNewsQuery(6), queryFn: () => home.then((data) => data.news, () => getPublishedNews(6)) })
  void queryClient.prefetchQuery({
    ...termsQuery(),
    queryFn: () =>
      home.then(
        (data) => data.terms,
        () =>
          getTerms().then((terms) => {
            const term = homeTerm(terms)
            if (term) void queryClient.prefetchQuery(coursesQuery(true, { term: term.code }))
            return terms
          }),
      ),
  })
  // Osh's two weeks — the visitor's too, unless their calendar day differs.
  void queryClient.prefetchQuery({
    ...timetableQuery(range),
    queryFn: () =>
      home.then(
        (data) => (data.range.from === range.from && data.range.to === range.to ? data.timetable : getTimetable(range)),
        () => getTimetable(range),
      ),
  })
}

/** Resolves once the saved cache is in place; the prefetch it starts is not awaited. */
export async function startPublicData(language: Language) {
  await restoreCache()
  prefetchHome(language)
}
