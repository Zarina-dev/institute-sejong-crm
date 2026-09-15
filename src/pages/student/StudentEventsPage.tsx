import { Card, List } from 'antd'

import { PageHeader } from '../../shared/PageHeader'

/** Static until an events API exists. */
const events = [
  { id: 'orientation', title: '학기 초 오리엔테이션', description: '학사 일정, 시설 안내, 담당 선생님 소개' },
  { id: 'career', title: '취업 워크숍', description: '이력서 작성과 면접 준비' },
]

export function StudentEventsPage() {
  return (
    <div className="page-layout">
      <PageHeader level={2} title="행사" description="학기 중 진행되는 행사와 안내사항을 확인할 수 있습니다." />
      <Card className="surface-card">
        <List
          dataSource={events}
          renderItem={(event) => (
            <List.Item key={event.id}>
              <List.Item.Meta title={event.title} description={event.description} />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
