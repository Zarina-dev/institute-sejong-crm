import { usePreferences } from '../../../app/preferences'
import { ContentSection } from '../../../features/content/ContentSection'
import { PageHeader } from '../../../shared/PageHeader'

/** 교재 안내 — textbook information written by the admin. */
export function TextbooksPage() {
  const { t } = usePreferences()

  return (
    <div className="page-layout article-layout">
      <PageHeader kicker={t('siteNav.resources')} title={t('pageCopy.textbooksTitle')} />
      <ContentSection slug="resources.textbooks" emptyText={t('pageCopy.textbooksFallback')} />
    </div>
  )
}