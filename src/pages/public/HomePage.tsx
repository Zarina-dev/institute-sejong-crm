import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Row, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

type Audience = {
  tone: 'applicant' | 'student' | 'teacher'
  icon: ReactNode
  label: string
  title: string
  description: string
  linkLabel: string
  link: string
  /** Admin/student areas are standalone apps — open them in their own tab. */
  newTab?: boolean
}

const audiences: Audience[] = [
  {
    tone: 'applicant',
    icon: <SolutionOutlined />,
    label: 'Future students',
    title: 'Applicants',
    description:
      'Explore programmes, admissions support, campus life, and what your next chapter can look like.',
    linkLabel: 'Discover Institut',
    link: '/about',
  },
  {
    tone: 'student',
    icon: <UserOutlined />,
    label: 'Current students',
    title: 'Students',
    description:
      'Find your classes, study resources, personal results, and the services you need today.',
    linkLabel: 'Go to student tools',
    link: '/schedule',
  },
  {
    tone: 'teacher',
    icon: <TeamOutlined />,
    label: 'Faculty and staff',
    title: 'Teachers',
    description:
      'Review academic activity, publish resources, and keep your courses moving forward.',
    linkLabel: 'Open staff overview',
    link: '/admin',
    newTab: true,
  },
]

const quickLinks = [
  {
    icon: <CalendarOutlined />,
    title: 'Class schedule',
    description: 'Know exactly where to be and when.',
    link: '/schedule',
  },
  {
    icon: <FileTextOutlined />,
    title: 'Course materials',
    description: 'Notes and files for every subject.',
    link: '/materials',
  },
  {
    icon: <UserOutlined />,
    title: 'Student portal',
    description: 'Your results and protected data.',
    link: '/login',
  },
]

const newsPreview = [
  { id: 1, title: 'Semester registration is open', date: 'Sep 2026' },
  { id: 2, title: 'New language lab opens on campus', date: 'Sep 2026' },
  { id: 3, title: 'Autumn student activities announced', date: 'Sep 2026' },
]

function SectionHeading({ kicker, title, aside }: { kicker: string; title: string; aside: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        <Text className="section-kicker">{kicker}</Text>
        <Title level={2}>{title}</Title>
      </div>
      {aside}
    </div>
  )
}

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-panel">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={14}>
            <Tag className="hero-tag">2026 / 2027 academic year</Tag>
            <Title level={1} className="hero-title">
              A university experience built around your next step.
            </Title>
            <Paragraph className="hero-copy">
              Programmes, academic life, learning tools, and campus updates in one clear place for
              every member of our community.
            </Paragraph>
            <div className="hero-actions">
              <Link to="/courses">
                <Button type="primary" size="large" icon={<SolutionOutlined />}>
                  Explore programmes
                </Button>
              </Link>
              <Link to="/schedule">
                <Button className="hero-secondary" size="large" icon={<CalendarOutlined />}>
                  Academic calendar
                </Button>
              </Link>
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <Card variant="borderless" className="hero-update">
              <div className="update-icon" aria-hidden="true">
                <ClockCircleOutlined />
              </div>
              <Text className="update-label">Admissions 2026</Text>
              <Title level={3}>Applications are now open</Title>
              <Paragraph>
                Start your application, learn about our programmes, and speak with our admissions
                team.
              </Paragraph>
              <Link to="/about">
                Plan your visit <ArrowRightOutlined />
              </Link>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="audience-section">
        <SectionHeading
          kicker="Find your path"
          title="Who are you visiting as?"
          aside={<Text type="secondary">Start with the information made for you</Text>}
        />
        <Row gutter={[18, 18]}>
          {audiences.map((audience) => (
            <Col xs={24} md={8} key={audience.tone}>
              <Card className={`surface-card audience-card ${audience.tone}`}>
                <span className="audience-icon" aria-hidden="true">{audience.icon}</span>
                <Text className="audience-label">{audience.label}</Text>
                <Title level={3}>{audience.title}</Title>
                <Paragraph>{audience.description}</Paragraph>
                <Link
                  to={audience.link}
                  {...(audience.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  {audience.linkLabel} <ArrowRightOutlined />
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="quick-section">
        <SectionHeading
          kicker="Most visited"
          title="Essential university services"
          aside={<Text type="secondary">The places our community uses most</Text>}
        />
        <Row gutter={[16, 16]}>
          {quickLinks.map((item) => (
            <Col xs={24} md={8} key={item.title}>
              <Card className="surface-card quick-card">
                <span className="quick-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <Title level={4}>{item.title}</Title>
                <Paragraph type="secondary">{item.description}</Paragraph>
                <Link to={item.link}>
                  Open <ArrowRightOutlined />
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="today-section">
        <SectionHeading
          kicker="Academic calendar"
          title="What's happening this week"
          aside={
            <Link to="/schedule">
              <Button type="link" icon={<CalendarOutlined />}>
                Full schedule
              </Button>
            </Link>
          }
        />
        <Card className="surface-card today-card">
          <div className="today-date">
            <span>MON</span>
            <strong>14</strong>
            <small>SEP</small>
          </div>
          <div className="next-class">
            <Text type="secondary">NEXT CLASS</Text>
            <Title level={4}>Mathematics</Title>
            <span>
              <ClockCircleOutlined /> 09:00 – 10:30 · Room A-101
            </span>
          </div>
          <div className="today-progress">
            <div>
              <Text type="secondary">THIS WEEK</Text>
              <strong>3 classes planned</strong>
            </div>
            <div className="progress-track" role="presentation">
              <i />
            </div>
          </div>
          <div className="today-status">
            <CheckCircleFilled />
            <span>Registration open</span>
          </div>
        </Card>
      </section>

      <section className="news-preview">
        <SectionHeading
          kicker="Campus news"
          title="Latest news and events"
          aside={
            <Link to="/news">
              <Button type="link" icon={<ArrowRightOutlined />}>
                View all news
              </Button>
            </Link>
          }
        />
        <Row gutter={[16, 16]}>
          {newsPreview.map((item) => (
            <Col xs={24} md={8} key={item.id}>
              <Card
                className="surface-card news-card"
                title={item.title}
                extra={<Text type="secondary">{item.date}</Text>}
              >
                <Paragraph type="secondary">
                  A concise update on institute events, upcoming opportunities, and student
                  activities.
                </Paragraph>
                <Link to="/news">Read more</Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  )
}
