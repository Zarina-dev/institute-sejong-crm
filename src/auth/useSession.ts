import { useSyncExternalStore } from 'react'

import { getSession, subscribeToSession, type DemoSession } from './demoAuth'

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
