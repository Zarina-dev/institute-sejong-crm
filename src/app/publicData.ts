import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/query-persist-client-core'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

import { coursesQuery, timetableQuery } from '../features/courses/queries'
import { upcomingRange } from '../features/courses/week'
import { publishedNewsQuery } from '../features/news/queries'
import { homeTerm } from '../features/terms/current'
import { termsQuery } from '../features/terms/queries'
import { setApiLanguage } from '../api/client'
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

/**
 * Starts the home page's requests now, in parallel with the dictionary and
 * the first render, instead of when HomePage mounts (after all code has
 * loaded and rendered). The courses need the semester, so they follow the
 * terms request — the one unavoidable step; the news and timetable do not
 * wait for it. Same query options as the hooks, so they share one request.
 */
function prefetchHome(language: Language) {
  if (window.location.pathname !== '/') return

  setApiLanguage(language) // the first render has not run PreferencesProvider yet
  void queryClient.prefetchQuery(publishedNewsQuery(6))
  void queryClient.prefetchQuery(timetableQuery(upcomingRange()))
  void queryClient
    .fetchQuery(termsQuery())
    .then((terms) => {
      const term = homeTerm(terms)
      if (term) void queryClient.prefetchQuery(coursesQuery(true, { term: term.code }))
    })
    .catch(() => {})
}

/** Resolves once the saved cache is in place; the prefetch it starts is not awaited. */
export async function startPublicData(language: Language) {
  await restoreCache()
  prefetchHome(language)
}
