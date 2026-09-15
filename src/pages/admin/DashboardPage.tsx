import {
  ArrowUpOutlined,
  BookOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'

const { Title, Text } = Typography

type Stat = {
  title: string
  value: string
  delta: string
  icon: ReactNode
  tone: 'blue' | 'violet' | 'orange' | 'green'
}

const stats: Stat[] = [
  { title: 'Total students', value: '245', delta: '+12 this month', icon: <TeamOutlined />, tone: 'blue' },
  { title: 'Upcoming classes', value: '18', delta: 'Next 7 days', icon: <CalendarOutlined />, tone: 'violet' },
  { title: 'Published news', value: '12', delta: '+3 this week', icon: <FileTextOutlined />, tone: 'orange' },
  { title: 'Learning resources', value: '96', delta: 'Across all courses', icon: <BookOutlined />, tone: 'green' },
]

type Activity = {
  tone: 'blue' | 'orange' | 'green'
  title: string
  description: string
  time: string
}

const activity: Activity[] = [
  {
    tone: 'blue',
    title: 'New student registration',
    description: 'A new registration was submitted for Computer Science.',
    time: '10 min ago',
  },
  {
    tone: 'orange',
    title: 'Material uploaded',
    description: 'Physics Lab Presentation was added to the library.',
    time: '1 hr ago',
  },
  {
    tone: 'green',
    title: 'News published',
    description: 'Semester registration announcement is now visible.',
    time: '3 hr ago',
  },
]

const priorities = [
  'Review 4 pending registrations',
  'Confirm tomorrow class rooms',
  'Publish the weekly student update',
]

export function DashboardPage() {
  return (
    <div className="page-layout dashboard-page">
      <header className="page-heading">
        <Text className="section-kicker">Admin overview</Text>
        <Title level={1}>Good morning, Admin</Title>
        <Text>Here is what is happening across the institute today.</Text>
      </header>

      <Row gutter={[18, 18]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} xl={6} key={stat.title}>
            <Card className={`surface-card stat-card ${stat.tone}`}>
              <div className="stat-icon" aria-hidden="true">
                {stat.icon}
              </div>
              <Text type="secondary">{stat.title}</Text>
              <strong>{stat.value}</strong>
              <span>
                <ArrowUpOutlined /> {stat.delta}
              </span>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} lg={15}>
          <Card className="surface-card dashboard-panel">
            <div className="panel-heading">
              <div>
                <Text className="section-kicker">Activity</Text>
                <Title level={3}>Recent updates</Title>
              </div>
              <Tag color="blue">Live</Tag>
            </div>

            {activity.map((item) => (
              <div className="activity-row" key={item.title}>
                <span className={`activity-dot ${item.tone}`} aria-hidden="true" />
                <div>
                  <b>{item.title}</b>
                  <Text type="secondary">{item.description}</Text>
                </div>
                <Text type="secondary">{item.time}</Text>
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card className="surface-card dashboard-panel action-panel">
            <Text className="section-kicker">At a glance</Text>
            <Title level={3}>Today's priorities</Title>
            <ul>
              {priorities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
