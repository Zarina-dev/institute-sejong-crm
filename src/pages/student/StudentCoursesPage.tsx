import { SendOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Empty, Row, Skeleton, Typography } from 'antd'
import { useCallback, useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { useCurrentStudent } from '../../auth/useCurrentStudent'
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
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const { session, student } = useCurrentStudent()

  const courses = useCourses(true)
  const applications = useApplications()
  const createApplication = useCreateApplication()

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
      if (!student?.id) {
        message.error(t('courses.student.noStudentInfo'))
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
          onSuccess: () => message.success(t('courses.appliedShort')),
          onError: (err) => message.error(getErrorMessage(err, t('courses.applyFailed'))),
        },
      )
    },
    [createApplication, message, student, t],
  )

  if (!student?.studentId) {
    return (
      <div className="page-layout">
        <PageHeader level={2} title={t('courses.student.title')} />
        <Card className="surface-card empty-card">
          <Empty description={t('courses.student.notLoggedIn')} />
        </Card>
      </div>
    )
  }

  const isPending = courses.isPending || applications.isPending

  return (
    <div className="page-layout">
      <PageHeader level={2} title={t('courses.student.title')} description={t('courses.student.subtitle')} />

      <Card className="surface-card">
        <Descriptions column={{ xs: 1, md: 3 }} size="small">
          <Descriptions.Item label={t('courses.student.currentCourse')}>
            {student.course || t('courses.student.noCurrentCourse')}
          </Descriptions.Item>
          <Descriptions.Item label={t('courses.studentId')}>{student.studentId}</Descriptions.Item>
          <Descriptions.Item label={t('courses.student.myApplications')}>
            {myApplicationsByCourse.size > 0 ? t('courses.applications', { count: myApplicationsByCourse.size }) : t('common.none')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <ErrorAlert error={courses.error ?? applications.error} fallback={t('courses.loadFailed')} />

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
            const submitting = createApplication.isPending && createApplication.variables?.courseId === course.id

            return (
              <Col xs={24} md={12} lg={8} key={course.id}>
                <CourseCard
                  course={course}
                  footer={
                    application ? (
                      <div className="application-state">
                        <ApplicationStatusTag status={application.status} />
                        <Text type="secondary">
                          {t('courses.student.appliedOn', { date: formatDate(application.createdAt, language) })}
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
                        {t('courses.apply')}
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
          <Empty description={t('courses.empty')} />
        </Card>
      )}
    </div>
  )
}
