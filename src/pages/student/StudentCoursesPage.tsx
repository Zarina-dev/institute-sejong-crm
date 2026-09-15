import { SendOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Empty, Row, Skeleton, Typography } from 'antd'
import { useCallback, useMemo } from 'react'

import { useCurrentStudent } from '../../auth/useCurrentStudent'
import { applicationStatusMeta } from '../../features/courses/applicationStatus'
import { ApplicationStatusTag } from '../../features/courses/ApplicationStatusTag'
import { CourseCard } from '../../features/courses/CourseCard'
import { useApplications, useCourses, useCreateApplication } from '../../features/courses/queries'
import type { CourseApplicationRecord } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

export function StudentCoursesPage() {
  const { message } = App.useApp()
  const { session, student } = useCurrentStudent()

  const courses = useCourses(true)
  const applications = useApplications()
  const createApplication = useCreateApplication()

  /**
   * The API returns every application; only this student's matter here.
   * Recomputed only when the list or the identity keys change — not on the
   * re-render caused by pressing "apply" on a card.
   */
  const myApplicationsByCourse = useMemo(() => {
    const map = new Map<string, CourseApplicationRecord>()

    for (const application of applications.data ?? []) {
      const isMine =
        application.studentId === student?.id ||
        application.applicantEmail === student?.email ||
        application.studentId === session?.studentId

      if (isMine) {
        map.set(application.courseId, application)
      }
    }

    return map
  }, [applications.data, session?.studentId, student?.email, student?.id])

  const handleApply = useCallback(
    (courseId: string) => {
      if (!student) {
        message.error('로그인된 학생 정보를 찾을 수 없습니다.')
        return
      }

      createApplication.mutate(
        {
          courseId,
          studentId: student.id,
          applicantName: student.name,
          applicantEmail: student.email,
          phone: student.phone,
        },
        {
          onSuccess: () => message.success('수강 신청이 접수되었습니다.'),
          onError: (err) => message.error(getErrorMessage(err, '수강 신청에 실패했습니다.')),
        },
      )
    },
    [createApplication, message, student],
  )

  if (!student?.studentId) {
    return (
      <div className="page-layout">
        <PageHeader level={2} title="수강 정보/신청" />
        <Card className="surface-card empty-card">
          <Empty description="로그인된 학생 정보가 없어 수강 신청 목록을 볼 수 없습니다." />
        </Card>
      </div>
    )
  }

  const isPending = courses.isPending || applications.isPending

  return (
    <div className="page-layout">
      <PageHeader
        level={2}
        title="수강 정보/신청"
        description="공개된 과정 목록을 확인하고, 신청 상태와 승인 결과를 바로 확인할 수 있습니다."
      />

      <Card className="surface-card">
        <Descriptions column={{ xs: 1, md: 3 }} size="small">
          <Descriptions.Item label="현재 수강 중인 과정">{student.course || '아직 승인된 수강 과정이 없습니다.'}</Descriptions.Item>
          <Descriptions.Item label="학생 ID">{student.studentId}</Descriptions.Item>
          <Descriptions.Item label="신청 내역">
            {myApplicationsByCourse.size > 0 ? `${myApplicationsByCourse.size}건` : '없음'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <ErrorAlert error={courses.error ?? applications.error} fallback="수강 정보를 불러오지 못했습니다." />

      {isPending ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 3 }, (_, index) => (
            <Col xs={24} md={12} lg={8} key={index}>
              <Card className="surface-card">
                <Skeleton active paragraph={{ rows: 5 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : courses.data && courses.data.length > 0 ? (
        <Row gutter={[16, 16]}>
          {courses.data.map((course) => {
            const application = myApplicationsByCourse.get(course.id)
            const status = application?.status ?? null
            const submitting = createApplication.isPending && createApplication.variables?.courseId === course.id

            return (
              <Col xs={24} md={12} lg={8} key={course.id}>
                <CourseCard
                  course={course}
                  footer={
                    application ? (
                      <div className="application-state">
                        <ApplicationStatusTag status={status} />
                        <Text type="secondary">
                          {status ? applicationStatusMeta[status].label : '신청됨'} · 신청일 {formatDate(application.createdAt)}
                        </Text>
                      </div>
                    ) : (
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        block
                        loading={submitting}
                        disabled={createApplication.isPending && !submitting}
                        onClick={() => handleApply(course.id)}
                      >
                        수강 신청
                      </Button>
                    )
                  }
                />
              </Col>
            )
          })}
        </Row>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description="공개된 과정이 없습니다." />
        </Card>
      )}
    </div>
  )
}
