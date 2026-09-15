import { Card, Empty, List, Skeleton, Tag, Typography } from 'antd'

import { usePreferences } from '../../app/preferences'
import { useCurrentStudent } from '../../auth/useCurrentStudent'
import { useStudentEnrollments } from '../../features/courses/queries'
import type { EnrollmentRecord } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

const statusColor: Record<NonNullable<EnrollmentRecord['status']>, string> = {
  active: 'green',
  completed: 'blue',
  paused: 'gold',
}

export function StudentEnrollmentsPage() {
  const { t, language } = usePreferences()
  const { session, student } = useCurrentStudent()
  const studentId = student?.id ?? session?.studentId
  const enrollments = useStudentEnrollments(studentId)

  return (
    <div className="page-layout">
      <PageHeader level={2} title={t('enrollments.title')} description={t('enrollments.subtitle')} />

      <ErrorAlert error={enrollments.error} fallback={t('enrollments.loadFailed')} />

      <Card className="surface-card">
        {enrollments.isPending && studentId ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : enrollments.data && enrollments.data.length > 0 ? (
          <List
            dataSource={enrollments.data}
            renderItem={(enrollment) => {
              const status = enrollment.status ?? 'active'

              return (
                <List.Item key={enrollment.id}>
                  <List.Item.Meta
                    title={enrollment.course?.title ?? t('enrollments.unknownCourse')}
                    description={
                      <>
                        {enrollment.course?.subject ? <Text type="secondary">{enrollment.course.subject} · </Text> : null}
                        <Text type="secondary">{t('enrollments.enrolledOn', { date: formatDate(enrollment.createdAt, language) })}</Text>
                      </>
                    }
                  />
                  <Tag color={statusColor[status]}>{t(`enrollments.status.${status}`)}</Tag>
                </List.Item>
              )
            }}
          />
        ) : (
          <Empty description={t('enrollments.empty')} />
        )}
      </Card>
    </div>
  )
}
