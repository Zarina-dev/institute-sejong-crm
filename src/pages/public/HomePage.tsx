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

import { usePreferences, type TranslationKey } from '../../app/preferences'

const { Title, Paragraph, Text } = Typography

type Audience = {
  tone: 'applicant' | 'student' | 'teacher'
  icon: ReactNode
  label: TranslationKey
  title: TranslationKey
  copy: TranslationKey
  linkLabel: TranslationKey
  link: string
  /** Admin/student areas are standalone apps — open them in their own tab. */
  newTab?: boolean
}

const audiences: Audience[] = [
  { tone: 'applicant', icon: <SolutionOutlined />, label: 'home.applicantsLabel', title: 'home.applicantsTitle', copy: 'home.applicantsCopy', linkLabel: 'home.applicantsLink', link: '/about' },
  { tone: 'student', icon: <UserOutlined />, label: 'home.studentsLabel', title: 'home.studentsTitle', copy: 'home.studentsCopy', linkLabel: 'home.studentsLink', link: '/schedule' },
  { tone: 'teacher', icon: <TeamOutlined />, label: 'home.teachersLabel', title: 'home.teachersTitle', copy: 'home.teachersCopy', linkLabel: 'home.teachersLink', link: '/admin', newTab: true },
]

const quickLinks: Array<{ icon: ReactNode; title: TranslationKey; copy: TranslationKey; link: string }> = [
  { icon: <CalendarOutlined />, title: 'home.quickSchedule', copy: 'home.quickScheduleCopy', link: '/schedule' },
  { icon: <FileTextOutlined />, title: 'home.quickMaterials', copy: 'home.quickMaterialsCopy', link: '/materials' },
  { icon: <UserOutlined />, title: 'home.quickPortal', copy: 'home.quickPortalCopy', link: '/login' },
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
  const { t } = usePreferences()

  return (
    <div className="home-page">
      <section className="hero-panel">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={14}>
            <Tag className="hero-tag">{t('home.heroTag')}</Tag>
            <Title level={1} className="hero-title">
              {t('home.heroTitle')}
            </Title>
            <Paragraph className="hero-copy">{t('home.heroCopy')}</Paragraph>
            <div className="hero-actions">
              <Link to="/courses">
                <Button type="primary" size="large" icon={<SolutionOutlined />}>
                  {t('home.explore')}
                </Button>
              </Link>
              <Link to="/schedule">
                <Button className="hero-secondary" size="large" icon={<CalendarOutlined />}>
                  {t('home.calendar')}
                </Button>
              </Link>
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <Card variant="borderless" className="hero-update">
              <div className="update-icon" aria-hidden="true">
                <ClockCircleOutlined />
              </div>
              <Text className="update-label">{t('home.admissions')}</Text>
              <Title level={3}>{t('home.admissionsTitle')}</Title>
              <Paragraph>{t('home.admissionsCopy')}</Paragraph>
              <Link to="/about">
                {t('home.planVisit')} <ArrowRightOutlined />
              </Link>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="audience-section">
        <SectionHeading kicker={t('home.findPath')} title={t('home.whoTitle')} aside={<Text type="secondary">{t('home.whoAside')}</Text>} />
        <Row gutter={[18, 18]}>
          {audiences.map((audience) => (
            <Col xs={24} md={8} key={audience.tone}>
              <Card className={`surface-card audience-card ${audience.tone}`}>
                <span className="audience-icon" aria-hidden="true">{audience.icon}</span>
                <Text className="audience-label">{t(audience.label)}</Text>
                <Title level={3}>{t(audience.title)}</Title>
                <Paragraph>{t(audience.copy)}</Paragraph>
                <Link to={audience.link} {...(audience.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}>
                  {t(audience.linkLabel)} <ArrowRightOutlined />
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="quick-section">
        <SectionHeading kicker={t('home.mostVisited')} title={t('home.servicesTitle')} aside={<Text type="secondary">{t('home.servicesAside')}</Text>} />
        <Row gutter={[16, 16]}>
          {quickLinks.map((item) => (
            <Col xs={24} md={8} key={item.link}>
              <Card className="surface-card quick-card">
                <span className="quick-icon" aria-hidden="true">{item.icon}</span>
                <Title level={4}>{t(item.title)}</Title>
                <Paragraph type="secondary">{t(item.copy)}</Paragraph>
                <Link to={item.link}>
                  {t('common.open')} <ArrowRightOutlined />
                </Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className="today-section">
        <SectionHeading
          kicker={t('home.academicCalendar')}
          title={t('home.weekTitle')}
          aside={
            <Link to="/schedule">
              <Button type="link" icon={<CalendarOutlined />}>
                {t('home.fullSchedule')}
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
            <Text type="secondary">{t('home.nextClass')}</Text>
            <Title level={4}>Mathematics</Title>
            <span>
              <ClockCircleOutlined /> 09:00 – 10:30 · Room A-101
            </span>
          </div>
          <div className="today-progress">
            <div>
              <Text type="secondary">{t('home.thisWeek')}</Text>
              <strong>{t('home.classesPlanned', { count: 3 })}</strong>
            </div>
            <div className="progress-track" role="presentation">
              <i />
            </div>
          </div>
          <div className="today-status">
            <CheckCircleFilled />
            <span>{t('home.registrationOpen')}</span>
          </div>
        </Card>
      </section>

      <section className="news-preview">
        <SectionHeading
          kicker={t('home.campusNews')}
          title={t('home.newsTitle')}
          aside={
            <Link to="/news">
              <Button type="link" icon={<ArrowRightOutlined />}>
                {t('common.viewAll')}
              </Button>
            </Link>
          }
        />
        <Row gutter={[16, 16]}>
          {newsPreview.map((item) => (
            <Col xs={24} md={8} key={item.id}>
              <Card className="surface-card news-card" title={item.title} extra={<Text type="secondary">{item.date}</Text>}>
                <Paragraph type="secondary">{t('home.newsCopy')}</Paragraph>
                <Link to="/news">{t('common.readMore')}</Link>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  )
}
