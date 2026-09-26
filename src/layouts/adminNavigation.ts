import type { TranslationKey } from '../app/preferences'

export type AdminNavItem = {
  to: string
  /** What the admin manages here. */
  labelKey: TranslationKey
  /** Where it shows up on the public site — printed under the label. */
  hintKey?: TranslationKey
  /** Match only this exact path — needed for the index route `/admin`. */
  end?: boolean
}

export type AdminNavGroup = {
  /** Section of the public site this block feeds, or `undefined` for standalone entries. */
  labelKey?: TranslationKey
  items: AdminNavItem[]
}

/**
 * The admin menu follows the public menu, section by section, so "where do I
 * change this?" has the same answer as "where do visitors see it?". Each
 * entry names the page it feeds.
 */
export const adminNavigation: AdminNavGroup[] = [
  {
    items: [{ to: '/admin', labelKey: 'adminNav.dashboard', end: true }],
  },
  {
    labelKey: 'siteNav.about',
    items: [
      { to: '/admin/staff', labelKey: 'adminNav.staff', hintKey: 'adminNav.hints.staff' },
      { to: '/admin/content', labelKey: 'adminNav.content', hintKey: 'adminNav.hints.content' },
    ],
  },
  {
    labelKey: 'siteNav.programmes',
    items: [{ to: '/admin/courses', labelKey: 'adminNav.courses', hintKey: 'adminNav.hints.courses' }],
  },
  {
    labelKey: 'siteNav.notices',
    items: [{ to: '/admin/news', labelKey: 'adminNav.news', hintKey: 'adminNav.hints.news' }],
  },
  {
    labelKey: 'siteNav.resources',
    items: [
      { to: '/admin/textbooks', labelKey: 'adminNav.textbooks' },
      { to: '/admin/materials', labelKey: 'adminNav.materials' },
    ],
  },
  {
    labelKey: 'siteNav.history',
    items: [{ to: '/admin/gallery', labelKey: 'adminNav.gallery', hintKey: 'adminNav.hints.gallery' }],
  },
]
