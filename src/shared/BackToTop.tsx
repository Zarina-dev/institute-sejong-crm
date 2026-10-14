import { UpOutlined } from '@ant-design/icons'
import { FloatButton } from 'antd'
import { useEffect, useState } from 'react'

import { usePreferences } from '../app/preferences'

/** Shown once the reader is this far down the page. */
const SHOW_AFTER = 600

/**
 * "^" in the bottom-right corner of a long page: shown once the reader has
 * scrolled down a screen or so, and takes them back to the top in one click.
 * One native smooth scroll — antd's BackTop animates step by step, which the
 * site's `scroll-behavior: smooth` then slows to a crawl.
 */
export function BackToTop() {
  const { t } = usePreferences()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const update = () => setShown(window.scrollY > SHOW_AFTER)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  if (!shown) {
    return null
  }

  return (
    <FloatButton
      className="back-to-top"
      icon={<UpOutlined />}
      tooltip={t('common.backToTop')}
      aria-label={t('common.backToTop')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    />
  )
}
