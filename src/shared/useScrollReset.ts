import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Where each history entry was left, so going back returns there. */
const positions = new Map<string, number>()

/** How long a restore waits for the page's content to grow tall enough. */
const RESTORE_PATIENCE = 1500

/**
 * A new page opens at its top. Without this the window keeps the previous
 * page's scroll — click a menu entry at the foot of a page and the next one
 * opens at its bottom. The back and forward buttons return to where that
 * entry was left instead, as they do on any other site.
 *
 * Only a change of path moves the window: a filter that only changes the
 * query string (a year, a category) is the same page, and keeps its place.
 */
export function useScrollReset() {
  const { key, pathname } = useLocation()
  const navigationType = useNavigationType()
  const shownPath = useRef<string | null>(null)
  const currentKey = useRef(key)

  // Recorded as the visitor scrolls, not when the page is left: by then the
  // next page is already in the document and, if shorter, has clamped the
  // scroll. That clamp fires a scroll event too, but under the new entry's
  // key, which the reset below overwrites anyway.
  useEffect(() => {
    const record = () => positions.set(currentKey.current, window.scrollY)
    window.addEventListener('scroll', record, { passive: true })
    return () => window.removeEventListener('scroll', record)
  }, [])

  useLayoutEffect(() => {
    currentKey.current = key

    if (shownPath.current === pathname) {
      return
    }

    shownPath.current = pathname
    const target = navigationType === 'POP' ? (positions.get(key) ?? 0) : 0
    // 'instant': the document scrolls smoothly for in-page anchors, and a new
    // page should not visibly glide up from the bottom of the last one.
    window.scrollTo({ top: target, left: 0, behavior: 'instant' })

    if (target === 0) {
      return
    }

    // Going back, the page may still be loading what made it that long; keep
    // trying for a moment, and stop as soon as the visitor scrolls on their own.
    const started = performance.now()
    let frame = 0
    const retry = () => {
      if (Math.abs(window.scrollY - target) < 2 || performance.now() - started > RESTORE_PATIENCE) {
        return
      }
      window.scrollTo({ top: target, left: 0, behavior: 'instant' })
      frame = requestAnimationFrame(retry)
    }
    const stop = () => cancelAnimationFrame(frame)
    frame = requestAnimationFrame(retry)
    window.addEventListener('wheel', stop, { once: true, passive: true })
    window.addEventListener('touchstart', stop, { once: true, passive: true })

    return () => {
      stop()
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
  }, [key, navigationType, pathname])
}
