import { BookOutlined, FolderOpenOutlined, IdcardOutlined, CalendarOutlined } from '@ant-design/icons'
import { Card, Col, Row, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { useSession } from '../../auth/useSession'
import { useStudentEnrollments } from '../../features/courses/queries'
import { useMaterials } from '../../features/materials/queries'
import { PageHeader } from '../../shared/PageHeader'

const { Text, Paragraph } = Typography

export function StudentDashboardPage() {
  const session = useSession()
  const student = session?.student
  const studentId = student?.id ?? session?.studentId

  // Both are cheap head-counts and share the cache with their own pages, so
  // opening 수강 등록 or 자료실 afterwards is instant.
  const enrollments = useStudentEnrollments(studentId)
  const materials = useMaterials(
    { course: student?.course, published: 'true', limit: 1, page: 1 },
    { enabled: Boolean(student?.course) },
  )

  return (
    <div className="page-layout">
      <PageHeader
        level={2}
        title={`안녕하세요, ${student?.name || session?.displayName || '학생'}님`}
        description="기본 정보, 현재 수강 상태, 자료실 접근 권한을 한눈에 확인할 수 있습니다."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><BookOutlined /> 현재 수강 과정</>} extra={<Link to="/student/enrollments">자세히</Link>}>
            {student?.course ? (
              <>
                <Text strong>{student.course}</Text>
                <Paragraph type="secondary">
                  등록된 과정 {enrollments.data?.length ?? '…'}개 · <Tag color="green">정상 진행 중</Tag>
                </Paragraph>
              </>
            ) : (
              <Paragraph type="secondary">승인 대기 중인 과정이 없습니다. 수강 정보에서 과정을 신청하세요.</Paragraph>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><FolderOpenOutlined /> 자료실 접근</>} extra={<Link to="/student/materials">열기</Link>}>
            {student?.course ? (
              <Paragraph type="secondary">
                <Text strong>{student.course}</Text> 자료 {materials.data?.total ?? '…'}개를 다운로드할 수 있습니다.
              </Paragraph>
            ) : (
              <Paragraph type="secondary">관리자 승인 후 자료실이 열립니다.</Paragraph>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><IdcardOutlined /> 내 정보</>} extra={<Link to="/student/profile">전체 보기</Link>}>
            <Paragraph>학생 ID: <Text strong>{student?.studentId || session?.studentId || '-'}</Text></Paragraph>
            <Paragraph>레벨: <Text strong>{student?.level || '-'}</Text></Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card className="surface-card dash-card" title={<><CalendarOutlined /> 다가오는 행사</>} extra={<Link to="/student/events">모두</Link>}>
            <Paragraph>학기 초 오리엔테이션</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
