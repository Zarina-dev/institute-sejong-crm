import { Alert, Button, Card, Col, Empty, Row, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../../auth/useSession'
import { createApplication, getApplications, getCourses } from '../../features/courses/api/coursesApi'
import type { CourseApplicationRecord, CourseRecord } from '../../types'

const { Title, Paragraph, Text } = Typography

const statusMeta: Record<NonNullable<CourseApplicationRecord['status']>, { label: string; color: string }> = {
  pending: { label: '승인 대기 중', color: 'gold' },
  approved: { label: '승인 완료', color: 'green' },
  rejected: { label: '반려됨', color: 'red' },
  enrolled: { label: '수강 등록 완료', color: 'blue' },
}

export function StudentCoursesPage() {
  const session = useSession()
  const student = session?.student

  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [applications, setApplications] = useState<CourseApplicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingCourseId, setSubmittingCourseId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!student?.studentId) {
      setCourses([])
      setApplications([])
      setLoading(false)
      return
    }

    try {
      const [courseResponse, applicationResponse] = await Promise.all([
        getCourses(true),
        getApplications(),
      ])

      setCourses(courseResponse)
      setApplications(
        applicationResponse.filter(
          (application) =>
            application.studentId === student.id ||
            application.applicantEmail === student.email ||
            application.studentId === session?.studentId,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : '수강 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [student?.id, student?.email, student?.studentId, session?.studentId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const applicationByCourse = new Map(applications.map((application) => [application.courseId, application]))

  const handleApply = async (courseId: string) => {
    if (!student) {
      setError('로그인된 학생 정보를 찾을 수 없습니다.')
      return
    }

    try {
      setSubmittingCourseId(courseId)
      setError(null)

      await createApplication({
        courseId,
        studentId: student.id,
        applicantName: student.name,
        applicantEmail: student.email,
        phone: student.phone,
      })

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '수강 신청에 실패했습니다.')
    } finally {
      setSubmittingCourseId(null)
    }
  }

  if (!student?.studentId) {
    return (
      <div>
        <Title level={2}>수강 정보/신청</Title>
        <Card className="surface-card">
          <Paragraph>로그인된 학생 정보가 없어 수강 신청 목록을 볼 수 없습니다.</Paragraph>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Title level={2}>수강 정보/신청</Title>
      <Paragraph>공개된 과정 목록을 확인하고, 신청 상태와 승인 결과를 바로 확인할 수 있는 화면입니다.</Paragraph>

      <Card className="surface-card" style={{ marginBottom: 16 }}>
        <Paragraph>
          <Text strong>현재 수강 중인 과정:</Text> {student?.course || '아직 승인된 수강 과정이 없습니다.'}
        </Paragraph>
        <Paragraph>
          <Text strong>학생 ID:</Text> {student?.studentId || session?.studentId || '-'}
        </Paragraph>
        <Paragraph>
          <Text strong>신청 상태:</Text> {applications.length > 0 ? `${applications.length}건의 신청 내역` : '신청 내역 없음'}
        </Paragraph>
      </Card>

      {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} /> : null}

      {loading ? (
        <Text>수강 정보를 불러오는 중입니다...</Text>
      ) : courses.length > 0 ? (
        <Row gutter={[16, 16]}>
          {courses.map((course) => {
            const application = applicationByCourse.get(course.id)
            const status = application?.status ?? null

            return (
              <Col xs={24} md={12} lg={8} key={course.id}>
                <Card className="surface-card" title={course.title}>
                  <Paragraph>{course.description || '과정 설명이 없습니다.'}</Paragraph>
                  <Text strong>과목:</Text> {course.subject}
                  <br />
                  <Text strong>강사:</Text> {course.teacherName || '-'}
                  <br />
                  <Text strong>시간:</Text> {course.schedule || '-'}
                  <br />
                  <Text strong>강의실:</Text> {course.classroom || '-'}
                  <br />
                  <Text strong>기간:</Text> {course.startDate || '-'} ~ {course.endDate || '-'}
                  <br />

                  {application ? (
                    <div style={{ marginTop: 16 }}>
                      <Tag color={status ? statusMeta[status].color : 'default'}>
                        {status ? statusMeta[status].label : '신청 내역 있음'}
                      </Tag>
                      <div style={{ marginTop: 8, color: '#64748b' }}>
                        신청일: {new Date(application.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="primary"
                      style={{ marginTop: 16 }}
                      onClick={() => void handleApply(course.id)}
                      loading={submittingCourseId === course.id}
                    >
                      수강 신청
                    </Button>
                  )}
                </Card>
              </Col>
            )
          })}
        </Row>
      ) : (
        <Card className="surface-card">
          <Empty description="공개된 과정이 없습니다." />
        </Card>
      )}
    </div>
  )
}
