import { useLocation } from 'react-router-dom'

import { usePreferences } from '../app/preferences'
import { navigation } from '../layouts/navigation'

export type BreadcrumbStep = { to: string; label: string }

/**
 * The trail for the current page, read off the public menu — the menu is
 * already the site's structure, so nothing is typed twice. Admin routes are
 * not in it and get an empty trail; the panel has its own rail.
 */
export function useBreadcrumbTrail(): BreadcrumbStep[] {
  const { t } = usePreferences()
  const { pathname } = useLocation()

  if (pathname === '/') {
    return []
  }

  const section = navigation.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))

  if (!section) {
    return []
  }

  const child = section.children.find((item) => item.to === pathname)
  const landing = section.children[0]?.to ?? section.to

  return [
    { to: landing, label: t(section.labelKey) },
    ...(child ? [{ to: child.to, label: t(child.labelKey) }] : []),
  ]
}
