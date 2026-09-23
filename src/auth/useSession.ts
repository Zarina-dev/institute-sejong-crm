import { useSyncExternalStore } from 'react'

import { getSession, isSessionResolving, subscribeToSession, type AdminSession } from './session'

/** The administrator session as reactive state (null when signed out). */
export function useSession(): AdminSession | null {
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
