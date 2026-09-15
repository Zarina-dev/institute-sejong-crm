import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

export function StudentExamResultsPage() {
  return (
    <div>
      <Title level={2}>시험 결과</Title>
      <Paragraph>최근 시험 성적과 평가 결과를 한눈에 확인할 수 있는 화면입니다.</Paragraph>
      <Card className="surface-card">
        <Paragraph>최근 시험 결과입니다.</Paragraph>
        <Paragraph>중간고사: 92점 (A)</Paragraph>
      </Card>
    </div>
  )
}
