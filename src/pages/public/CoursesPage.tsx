import { EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'

import { contact, phoneHref } from '../../app/contact'
import { usePreferences } from '../../app/preferences'
import { CourseGroupList } from '../../features/courses/CourseGroupList'
import { useCourses } from '../../features/courses/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

/**
 * Public catalogue: programmes and their classes, read-only. Enrolment is
 * handled at the institute, so the page ends with its contact details
 * rather than an apply button.
 */
export function CoursesPage() {
  const { t } = usePreferences()
  const courses = useCourses(true)

  return (
    <div className="page-layout">
      <PageHeader kicker={t('nav.courses')} title={t('courses.publicTitle')} description={t('courses.publicSubtitle')} />

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      <CourseGroupList courses={courses.data} loading={courses.isPending} emptyText={t('courses.empty')} />

      <Card className="surface-card portal-callout">
        <div>
          <Text strong>{t('courses.contactCalloutTitle')}</Text>
          <Text type="secondary">{t('courses.contactCalloutCopy')}</Text>
        </div>
        <div className="portal-callout__actions">
          <a href={phoneHref}>
            <Button type="primary" icon={<PhoneOutlined />}>
              {contact.phone}
            </Button>
          </a>
          <Text type="secondary">
            <EnvironmentOutlined /> {contact.address}
          </Text>
        </div>
      </Card>
    </div>
  )
}
