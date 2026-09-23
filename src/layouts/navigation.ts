import type { TranslationKey } from '../app/preferences'

export type NavChild = { to: string; labelKey: TranslationKey }

export type NavSection = {
  /** Landing route of the section — the parent item links here too. */
  to: string
  labelKey: TranslationKey
  children: NavChild[]
}

/**
 * The public menu, one entry per section of the site plan:
 * 학당 소개 · 교육과정 · 알림마당 · 학습자료실 · 학당 발자취.
 * Every section's first child is its landing page, so the parent link and
 * the first dropdown item lead to the same place on purpose.
 */
export const navigation: NavSection[] = [
  {
    to: '/about',
    labelKey: 'siteNav.about',
    children: [
      { to: '/about', labelKey: 'siteNav.aboutGreeting' },
      { to: '/about/staff', labelKey: 'siteNav.aboutStaff' },
      { to: '/about/location', labelKey: 'siteNav.aboutLocation' },
    ],
  },
  {
    to: '/programmes',
    labelKey: 'siteNav.programmes',
    children: [
      { to: '/programmes', labelKey: 'siteNav.programmesCourses' },
      { to: '/programmes/calendar', labelKey: 'siteNav.programmesCalendar' },
      { to: '/programmes/culture', labelKey: 'siteNav.programmesCulture' },
    ],
  },
  {
    to: '/notices',
    labelKey: 'siteNav.notices',
    children: [
      { to: '/notices', labelKey: 'siteNav.noticesNotice' },
      { to: '/notices/press', labelKey: 'siteNav.noticesPress' },
      { to: '/notices/faq', labelKey: 'siteNav.noticesFaq' },
    ],
  },
  {
    to: '/resources',
    labelKey: 'siteNav.resources',
    children: [
      { to: '/resources', labelKey: 'siteNav.resourcesTextbooks' },
      { to: '/resources/materials', labelKey: 'siteNav.resourcesMaterials' },
      { to: '/resources/links', labelKey: 'siteNav.resourcesLinks' },
    ],
  },
  {
    to: '/history',
    labelKey: 'siteNav.history',
    children: [{ to: '/history', labelKey: 'siteNav.historyAlbums' }],
  },
]
