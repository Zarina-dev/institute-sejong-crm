import { Card, List } from 'antd'

import { usePreferences } from '../../app/preferences'
import { PageHeader } from '../../shared/PageHeader'

/** Static until an events API exists. */
export function StudentEventsPage() {
  const { t } = usePreferences()

  const events = [
    { id: 'orientation', title: t('events.orientation'), description: t('events.orientationDesc') },
    { id: 'career', title: t('events.career'), description: t('events.careerDesc') },
  ]

  return (
    <div className="page-layout">
      <PageHeader level={2} title={t('events.title')} description={t('events.subtitle')} />
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
