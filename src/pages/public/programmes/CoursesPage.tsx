import { EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons'
import { Button, Card, Typography } from 'antd'
import { useMemo } from 'react'

import { contact, phoneHref } from '../../../app/contact'
import { usePreferences } from '../../../app/preferences'
import { ContentSection } from '../../../features/content/ContentSection'
import { CourseGroupList } from '../../../features/courses/CourseGroupList'
import { useCourses } from '../../../features/courses/queries'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

type CoursesPageProps = {
  /** 강좌 안내 (language) or 문화 강좌 (culture) — the two 교육과정 menu items. */
  category: 'language' | 'culture'
}

/**
 * Public catalogue: programmes and their classes, read-only. Enrolment is
 * handled at the institute, so the page ends with its contact details
 * rather than an apply button.
 */
export function CoursesPage({ category }: CoursesPageProps) {
  const { t } = usePreferences()
  const courses = useCourses(true)

  const filtered = useMemo(
    () => courses.data?.filter((course) => (course.category ?? 'language') === category),
    [courses.data, category],
  )

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.programmes')}
        title={t(category === 'culture' ? 'pageCopy.cultureTitle' : 'pageCopy.coursesTitle')}
        description={t(category === 'culture' ? 'pageCopy.cultureSubtitle' : 'pageCopy.coursesSubtitle')}
      />

      <ContentSection slug={category === 'culture' ? 'programmes.culture' : 'programmes.courses'} optional />

      <ErrorAlert error={courses.error} fallback={t('courses.loadFailed')} />

      <CourseGroupList courses={filtered} loading={courses.isPending} emptyText={t('courses.empty')} />

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