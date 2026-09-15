import { Card, Typography } from 'antd'
import { useSession } from '../../auth/useSession'

const { Title, Paragraph, Text } = Typography

export function StudentProfilePage() {
  const session = useSession()
  const student = session?.student

  return (
    <div>
      <Title level={2}>내 정보</Title>
      <Paragraph>학생의 기본 정보, 현재 과정, 활동 상태, TOPIK 첨부 파일 정보를 확인하는 화면입니다.</Paragraph>
      <Card className="surface-card">
        <Paragraph><Text strong>이름:</Text> {student?.name ?? session?.displayName ?? '-'}</Paragraph>
        <Paragraph><Text strong>학번:</Text> {student?.studentId ?? session?.studentId ?? '-'}</Paragraph>
        <Paragraph><Text strong>이메일:</Text> {student?.email ?? '-'}</Paragraph>
        <Paragraph><Text strong>전화번호:</Text> {student?.phone ?? '-'}</Paragraph>
        <Paragraph><Text strong>과정:</Text> {student?.course ?? '-'}</Paragraph>
        <Paragraph><Text strong>TOPIK 레벨:</Text> {student?.level ?? '-'}</Paragraph>
        <Paragraph><Text strong>입학 날짜:</Text> {student?.admissionDate ?? '-'}</Paragraph>
        <Paragraph><Text strong>상태:</Text> {student?.status === 'active' ? '활동 중' : student?.status === 'inactive' ? '비활동' : '-'}</Paragraph>
      </Card>
    </div>
  )
}
