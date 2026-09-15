import { Card, Typography } from 'antd'

const { Title, Paragraph } = Typography

export function StudentEventsPage() {
  return (
    <div>
      <Title level={2}>행사</Title>
      <Paragraph>학기 중 진행되는 행사와 안내사항을 확인할 수 있는 화면입니다.</Paragraph>
      <Card className="surface-card">
        <Paragraph>학기 초 오리엔테이션</Paragraph>
        <Paragraph>취업 워크숍</Paragraph>
      </Card>
    </div>
  )
}
