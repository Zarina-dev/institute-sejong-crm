import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * A handler whose identity never changes but which always runs the latest
 * version of `callback` (the useEvent pattern). For handlers that table
 * columns close over: with useCallback they depended on mutation objects,
 * which TanStack Query recreates on every render, so the columns — and the
 * whole table — were rebuilt each time the page re-rendered (opening a
 * dialog, typing in it).
 *
 * Only for event handlers: never call it during render.
 */
export function useStableCallback<Args extends unknown[], Result>(callback: (...args: Args) => Result): (...args: Args) => Result {
  const latest = useRef(callback)

  useLayoutEffect(() => {
    latest.current = callback
  })

  return useCallback((...args: Args) => latest.current(...args), [])
}
