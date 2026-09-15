import { Card, Col, Row, Typography } from 'antd'
import { useSession } from '../../auth/useSession'

const { Title, Text, Paragraph } = Typography

export function StudentDashboardPage() {
  const session = useSession()
  const student = session?.student

  return (
    <div>
      <Title level={2}>학생 홈</Title>
      <Paragraph>학생 본인의 기본 정보, 현재 수강 상태, 자료실 접근 권한을 한눈에 확인할 수 있는 홈 화면입니다.</Paragraph>
      <Paragraph>안녕하세요, {student?.name || session?.displayName || '학생'}님. 아래 정보를 바로 확인할 수 있습니다.</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="현재 수강 과정" className="surface-card">
            <Text>{student?.course || '승인 대기 중인 과정이 없습니다.'}</Text>
            <br />
            <Text type="secondary">수업 상태: {student?.course ? '정상 진행 중' : '승인 대기'}</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="자료실 접근" className="surface-card">
            <Paragraph>{student?.course ? `${student.course} 자료를 확인할 수 있습니다.` : '승인 후 자료 파일을 확인할 수 있습니다.'}</Paragraph>
            <Paragraph>{student?.course ? '학생 포털의 자료실에서 다운로드 가능합니다.' : '관리자 승인 후 자료실이 열립니다.'}</Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="내 정보" className="surface-card">
            <Paragraph>학생 ID: {student?.studentId || session?.studentId || '-'}</Paragraph>
            <Paragraph>레벨: {student?.level || '-'}</Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="다가오는 행사" className="surface-card">
            <Paragraph>학기 초 오리엔테이션</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
