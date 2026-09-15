import { Alert, Button, Card, Col, Empty, Row, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { createApplication, getCourses } from '../../features/courses/api/coursesApi'
import type { CourseRecord } from '../../types'

const { Title, Text, Paragraph } = Typography

export function CoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCourses = async () => {
    try {
      const response = await getCourses(true)
      setCourses(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : '과정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCourses()
  }, [])

  const handleApply = async (courseId: string) => {
    try {
      const studentName = window.prompt('신청자 이름을 입력하세요.')?.trim()
      if (!studentName) return

      const email = window.prompt('이메일을 입력하세요.')?.trim()
      if (!email) return

      await createApplication({
        courseId,
        applicantName: studentName,
        applicantEmail: email,
      })

      window.alert('수강 신청이 접수되었습니다.')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '신청 처리에 실패했습니다.')
    }
  }

  return (
    <div className="page-layout">
      <header className="page-heading">
        <Text className="section-kicker">PROGRAMS</Text>
        <Title level={1}>수강</Title>
        <Text>공개 중인 수강 과정을 확인하고 신청할 수 있습니다.</Text>
      </header>

      {error ? <Alert type="error" message={error} showIcon /> : null}

      {loading ? (
        <Text>과정을 불러오는 중입니다...</Text>
      ) : courses.length > 0 ? (
        <Row gutter={[16, 16]}>
          {courses.map((course) => (
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
                <Button type="primary" style={{ marginTop: 16 }} onClick={() => handleApply(course.id)}>
                  수강 신청
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="surface-card">
          <Empty description="공개된 과정이 없습니다." />
        </Card>
      )}
    </div>
  )
}
