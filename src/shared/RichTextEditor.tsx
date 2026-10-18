import { lazy, Suspense, useEffect, useRef, useState } from 'react'

import type { RichTextEditorProps } from './RichTextEditorCore'

export type { RichTextEditorProps }

const loadCore = () => import('./RichTextEditorCore')
const RichTextEditorCore = lazy(() => loadCore().then((module) => ({ default: module.RichTextEditorCore })))

/** Room the toolbar takes above the text, so the box keeps its size when the editor arrives. */
const TOOLBAR_HEIGHT = 46

/**
 * The rich text editor (RichTextEditorCore: TipTap) as a form control,
 * created only once it is on screen.
 *
 * The admin dialogs are rendered ahead (`forceRender`) so their fields are
 * registered before they open, and the translation tabs are too — a news or
 * 행사·대회 page built four TipTap editors at load and redrew them whenever
 * the page did, and opening a dialog cost around two seconds on a slower
 * machine. Here the field stays registered and keeps its value, but until
 * the box comes into view (its dialog opens, its tab is chosen) it is an
 * empty frame of the same size. The editor's code (~150 kB) is fetched in
 * the background once the page is idle, so it is ready by then.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const frame = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible || !frame.current) return

    const prefetch = () => void loadCore().catch(() => {})
    let cancelPrefetch: () => void
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 })
      cancelPrefetch = () => window.cancelIdleCallback(id)
    } else {
      const id = setTimeout(prefetch, 1500)
      cancelPrefetch = () => clearTimeout(id)
    }

    // Hidden (a closed dialog, another tab) means display:none — never
    // intersecting. A little ahead of the viewport, for a long dialog.
    const observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && setVisible(true), { rootMargin: '300px' })
    observer.observe(frame.current)

    return () => {
      observer.disconnect()
      cancelPrefetch()
    }
  }, [visible])

  const placeholder = (
    <div ref={frame} className="rich-editor rich-editor--pending" style={{ minHeight: (props.minHeight ?? 320) + TOOLBAR_HEIGHT }} aria-busy="true" />
  )

  if (!visible) return placeholder

  return (
    <Suspense fallback={placeholder}>
      <RichTextEditorCore {...props} />
    </Suspense>
  )
}
