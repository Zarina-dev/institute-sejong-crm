import { Card, Empty, List, Skeleton, Tag, Typography } from 'antd'

import { useSession } from '../../auth/useSession'
import { useStudentEnrollments } from '../../features/courses/queries'
import type { EnrollmentRecord } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

const statusMeta: Record<NonNullable<EnrollmentRecord['status']>, { label: string; color: string }> = {
  active: { label: '수강 중', color: 'green' },
  completed: { label: '수료', color: 'blue' },
  paused: { label: '휴학', color: 'gold' },
}

export function StudentEnrollmentsPage() {
  const session = useSession()
  const studentId = session?.student?.id ?? session?.studentId
  const enrollments = useStudentEnrollments(studentId)

  return (
    <div className="page-layout">
      <PageHeader
        level={2}
        title="수강 등록 정보"
        description="관리자 승인 완료 후 등록된 과정과 현재 수강 상태를 확인할 수 있습니다."
      />

      <ErrorAlert error={enrollments.error} fallback="수강 등록 정보를 불러오지 못했습니다." />

      <Card className="surface-card">
        {enrollments.isPending && studentId ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : enrollments.data && enrollments.data.length > 0 ? (
          <List
            dataSource={enrollments.data}
            renderItem={(enrollment) => {
              const meta = statusMeta[enrollment.status ?? 'active']

              return (
                <List.Item key={enrollment.id}>
                  <List.Item.Meta
                    title={enrollment.course?.title ?? '과정명 미확인'}
                    description={
                      <>
                        {enrollment.course?.subject ? <Text type="secondary">{enrollment.course.subject} · </Text> : null}
                        <Text type="secondary">등록일 {formatDate(enrollment.createdAt)}</Text>
                      </>
                    }
                  />
                  <Tag color={meta.color}>{meta.label}</Tag>
                </List.Item>
              )
            }}
          />
        ) : (
          <Empty description="등록된 과정이 아직 없습니다." />
        )}
      </Card>
    </div>
  )
}
