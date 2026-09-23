import { usePreferences } from '../../../app/preferences'
import { ContentSection } from '../../../features/content/ContentSection'
import { PageHeader } from '../../../shared/PageHeader'

/** FAQ — a single admin-written block. */
export function FaqPage() {
  const { t } = usePreferences()

  return (
    <div className="page-layout article-layout">
      <PageHeader kicker={t('siteNav.notices')} title={t('pageCopy.faqTitle')} />
      <ContentSection slug="notices.faq" emptyText={t('pageCopy.faqFallback')} />
    </div>
  )
}