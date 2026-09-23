import { usePreferences } from '../../../app/preferences'
import { ContentSection } from '../../../features/content/ContentSection'
import { PageHeader } from '../../../shared/PageHeader'

/** 유용한 링크 — Nuri-Sejong, TOPIK and whatever else the admin adds. */
export function LinksPage() {
  const { t } = usePreferences()

  return (
    <div className="page-layout article-layout">
      <PageHeader kicker={t('siteNav.resources')} title={t('pageCopy.linksTitle')} />
      <ContentSection slug="resources.links" emptyText={t('pageCopy.linksFallback')} />
    </div>
  )
}