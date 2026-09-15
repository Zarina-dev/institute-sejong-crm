import { Card, Empty } from 'antd'

import { usePreferences } from '../../app/preferences'
import { PageHeader } from '../../shared/PageHeader'

/** No exam-results API exists yet; this is an honest placeholder, not fake data. */
export function StudentExamResultsPage() {
  const { t } = usePreferences()

  return (
    <div className="page-layout">
      <PageHeader level={2} title={t('exams.title')} description={t('exams.subtitle')} />
      <Card className="surface-card empty-card">
        <Empty description={t('exams.empty')} />
      </Card>
    </div>
  )
}
