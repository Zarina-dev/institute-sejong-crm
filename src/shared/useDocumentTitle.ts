import { useEffect } from 'react'

import { usePreferences } from '../app/preferences'

/**
 * The browser tab and the search result read the page and the institute in
 * the visitor's language: "Мероприятия и конкурсы · Институт короля Седжона
 * Ош 1". Without a page (the home page) it is the institute and what it
 * teaches. Search engines that run the site's script index this title.
 */
export function useDocumentTitle(page?: string) {
  const { t } = usePreferences()

  useEffect(() => {
    const site = t('brand.name')
    document.title = page ? `${page} · ${site}` : `${site} · ${t('brand.tagline')}`
  }, [page, t])
}
