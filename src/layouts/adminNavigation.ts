import type { TranslationKey } from '../app/preferences'

export type AdminNavItem = {
  /** Admin route, query string included — the query picks the view. */
  to: string
  /** The public page this entry edits; the site's own name for it. */
  labelKey: TranslationKey
  /** Match only this exact path — needed for the index route `/admin`. */
  end?: boolean
}

export type AdminNavGroup = {
  /** Section of the public menu. Clicking it opens the pages below. */
  labelKey: TranslationKey
  items: AdminNavItem[]
}

/** Shown above the groups; it belongs to no section of the site. */
export const adminDashboard: AdminNavItem = { to: '/admin', labelKey: 'adminNav.dashboard', end: true }

/**
 * The admin menu is the public menu: the same five sections, and under each
 * one the very pages a visitor sees. An admin looking for 인사말 opens
 * 학당 소개 and finds 인사말 — no need to know that it lives in the content
 * editor. Several entries share a screen and differ only by their query,
 * which selects the block, the category or the view.
 */
export const adminNavigation: AdminNavGroup[] = [
  {
    labelKey: 'siteNav.about',
    items: [
      { to: '/admin/content?block=about.greeting', labelKey: 'siteNav.aboutGreeting' },
      { to: '/admin/staff', labelKey: 'siteNav.aboutStaff' },
    ],
  },
  {
    labelKey: 'siteNav.programmes',
    items: [
      { to: '/admin/courses?view=language', labelKey: 'siteNav.programmesCourses' },
      { to: '/admin/courses?view=schedule', labelKey: 'siteNav.programmesCalendar' },
      { to: '/admin/courses?view=culture', labelKey: 'siteNav.programmesCulture' },
    ],
  },
  {
    labelKey: 'siteNav.notices',
    items: [
      { to: '/admin/news?view=notices', labelKey: 'siteNav.noticesNotice' },
      { to: '/admin/news?view=press', labelKey: 'siteNav.noticesPress' },
      { to: '/admin/content?block=notices.faq', labelKey: 'siteNav.noticesFaq' },
    ],
  },
  {
    labelKey: 'siteNav.resources',
    items: [
      { to: '/admin/textbooks', labelKey: 'siteNav.resourcesTextbooks' },
      { to: '/admin/materials', labelKey: 'siteNav.resourcesMaterials' },
      { to: '/admin/content?block=resources.links', labelKey: 'siteNav.resourcesLinks' },
    ],
  },
  {
    labelKey: 'siteNav.history',
    items: [
      { to: '/admin/gallery', labelKey: 'siteNav.historyAlbums' },
      { to: '/admin/content?block=history.intro', labelKey: 'adminNav.historyIntro' },
    ],
  },
]
