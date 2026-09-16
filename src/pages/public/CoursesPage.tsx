import { LoginOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { CourseGroupList } from '../../features/courses/CourseGroupList'
import { useCourses } from '../../features/courses/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

/**
 * Public catalogue: programmes and their classes, read-only. Applying
 * happens in the student portal after signing in, so there is no apply
 * button here — just a pointer to the portal.
 */
export function CoursesPage() {
  const { t } = usePreferences()
  const courses = useCourses(true)

  return (
    <div className="page-layout">
      <PageHeader kicker={t('nav.courses')} title={t('courses.publicTitle')} description={t('courses.publicSubtitle')} />

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      <CourseGroupList courses={courses.data} loading={courses.isPending} emptyText={t('courses.empty')} renderFooter={() => null} />

      <Card className="surface-card portal-callout">
        <div>
          <Text strong>{t('courses.portalCalloutTitle')}</Text>
          <Text type="secondary">{t('courses.portalCalloutCopy')}</Text>
        </div>
        <Link to="/login">
          <Button type="primary" icon={<LoginOutlined />}>
            {t('nav.login')}
          </Button>
        </Link>
      </Card>
    </div>
  )
}
