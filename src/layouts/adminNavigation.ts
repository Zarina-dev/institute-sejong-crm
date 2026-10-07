import type { TranslationKey } from '../app/preferences'

export type AdminNavItem = {
  /** Admin route, query string included — the query picks the view. */
  to: string
  /** The public page this entry edits; the site's own name for it. */
  labelKey: TranslationKey
  /** Match only this exact path — needed for the index route `/admin`. */
  end?: boolean
  /**
   * Shown, but not open to the admin. The name stays in the menu so the
   * page is still accounted for; `disabledReasonKey` says where its content
   * is managed instead.
   */
  disabled?: boolean
  disabledReasonKey?: TranslationKey
}

export type AdminNavGroup = {
  /** Section of the public menu. Clicking it opens the pages below. */
  labelKey: TranslationKey
  items: AdminNavItem[]
}

/** Shown above the groups; it belongs to no section of the site. */
export const adminDashboard: AdminNavItem = { to: '/admin', labelKey: 'adminNav.dashboard', end: true }

/** Shown below the groups: deletions from every section end up here. */
export const adminTrash: AdminNavItem = { to: '/admin/trash', labelKey: 'adminNav.trash' }

/** Below the trash: every change, from every section. */
export const adminAudit: AdminNavItem = { to: '/admin/audit', labelKey: 'adminNav.audit' }

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
      { to: '/admin/chronology', labelKey: 'siteNav.aboutChronology' },
    ],
  },
  {
    labelKey: 'siteNav.programmes',
    items: [
      // 학기 관리 comes first: the semester dates are what a class is filed
      // under, so they are set before any class is entered.
      { to: '/admin/terms', labelKey: 'terms.adminTitle' },
      { to: '/admin/courses?view=language', labelKey: 'siteNav.programmesCourses' },
      // 학사 일정 is the same table read a third way, so there is nothing
      // to manage here that 강좌 안내 and 문화 강좌 do not already manage.
      {
        to: '/admin/courses?view=schedule',
        labelKey: 'siteNav.programmesCalendar',
        disabled: true,
        disabledReasonKey: 'courses.scheduleManagedElsewhere',
      },
      { to: '/admin/courses?view=culture', labelKey: 'siteNav.programmesCulture' },
    ],
  },
  {
    labelKey: 'siteNav.notices',
    items: [
      { to: '/admin/news?view=notices', labelKey: 'siteNav.noticesNotice' },
      { to: '/admin/news?view=press', labelKey: 'siteNav.noticesPress' },
      { to: '/admin/events', labelKey: 'siteNav.noticesEvents' },
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
      // One record for every event, contests included — as on the site.
      { to: '/admin/competitions', labelKey: 'siteNav.historyRecords' },
      { to: '/admin/studies', labelKey: 'siteNav.historyStudies' },
    ],
  },
  /* Internal: nothing under this section appears on the public site. */
  {
    labelKey: 'adminNav.meetingsSection',
    items: [{ to: '/admin/meetings', labelKey: 'adminNav.meetingsItem' }],
  },
]
