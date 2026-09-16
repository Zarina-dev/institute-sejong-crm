import { useSyncExternalStore } from 'react'

import { getSession, isSessionResolving, subscribeToSession, type DemoSession } from './demoAuth'

/**
 * Reads the demo session as reactive state.
 *
 * Calling `getSession()` straight from a component body happened to work
 * because a route change re-rendered the tree anyway, but the header went
 * stale on same-route logins and never updated when the session changed in
 * another tab. Subscribing fixes both.
 */
export function useSession(): DemoSession | null {
  return useSyncExternalStore(subscribeToSession, getSession, () => null)
}

/**
 * True for the first few hundred milliseconds of a freshly opened tab while
 * it asks the other tabs of the site for their session. Guards should wait
 * rather than redirect to the login page during that window.
 */
export function useSessionResolving(): boolean {
  return useSyncExternalStore(subscribeToSession, isSessionResolving, () => false)
}
