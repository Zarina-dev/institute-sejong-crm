import { Alert, Card, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useSession } from '../../auth/useSession'
import { getStudentEnrollments } from '../../features/courses/api/coursesApi'
import type { EnrollmentRecord } from '../../types'

const { Title, Paragraph, Text } = Typography

export function StudentEnrollmentsPage() {
  const session = useSession()
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const studentId = session?.student?.id ?? session?.studentId

      if (!studentId) {
        setLoading(false)
        return
      }

      try {
        const response = await getStudentEnrollments(studentId)
        setEnrollments(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : '수강 등록 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [session?.student?.id, session?.studentId])

  return (
    <div>
      <Title level={2}>수강 등록 정보</Title>
      <Paragraph>관리자 승인 완료 후 등록된 과정과 현재 수강 상태를 확인할 수 있는 화면입니다.</Paragraph>
      <Card className="surface-card">
        <Paragraph>현재 학생이 승인되어 등록된 과정 정보입니다.</Paragraph>
        {error ? <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} /> : null}
        {loading ? (
          <Text>수강 정보를 불러오는 중입니다...</Text>
        ) : enrollments.length > 0 ? (
          enrollments.map((enrollment) => (
            <div key={enrollment.id} style={{ marginBottom: 12 }}>
              <Text strong>{enrollment.course?.title || '과정명 미확인'}</Text>
              <div style={{ color: '#64748b' }}>
                상태: {enrollment.status || 'active'} · 등록일: {new Date(enrollment.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
          ))
        ) : (
          <Text>등록된 과정이 아직 없습니다.</Text>
        )}
      </Card>
    </div>
  )
}
