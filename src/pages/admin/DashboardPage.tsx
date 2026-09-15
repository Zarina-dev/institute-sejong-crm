import { ArrowUpOutlined, BookOutlined, CalendarOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons'
import { Card, Col, Row, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'

import { usePreferences, type TranslationKey } from '../../app/preferences'
import { useApplications, useCourses } from '../../features/courses/queries'
import { useMaterials } from '../../features/materials/queries'
import { useStudents } from '../../features/students/queries'

const { Title, Text } = Typography

type Stat = { title: TranslationKey; value: number | string; delta: TranslationKey; icon: ReactNode; tone: 'blue' | 'violet' | 'orange' | 'green' }

/**
 * Admin landing. The four counters are live (same queries the admin pages
 * use, so they are already cached once any of those pages was opened); the
 * activity feed is still static until there is an audit log to read from.
 */
export function DashboardPage() {
  const { t } = usePreferences()
  const students = useStudents()
  const courses = useCourses(false)
  const applications = useApplications()
  const materials = useMaterials({ page: 1, limit: 1, published: 'all' })

  const pending = (applications.data ?? []).filter((a) => (a.status ?? 'pending') === 'pending').length

  const stats: Stat[] = [
    { title: 'dashboard.statStudents', value: students.data?.length ?? '…', delta: 'dashboard.statStudentsDelta', icon: <TeamOutlined />, tone: 'blue' },
    { title: 'adminNav.courses', value: courses.data?.length ?? '…', delta: 'dashboard.statClassesDelta', icon: <CalendarOutlined />, tone: 'violet' },
    { title: 'adminNav.applications', value: applications.data?.length ?? '…', delta: 'courses.noPending', icon: <FileTextOutlined />, tone: 'orange' },
    { title: 'dashboard.statResources', value: materials.data?.total ?? '…', delta: 'dashboard.statResourcesDelta', icon: <BookOutlined />, tone: 'green' },
  ]

  return (
    <div className="page-layout dashboard-page">
      <header className="page-heading">
        <Text className="section-kicker">{t('dashboard.adminKicker')}</Text>
        <Title level={1}>{t('dashboard.adminGreeting')}</Title>
        <Text>{t('dashboard.adminSubtitle')}</Text>
      </header>

      <Row gutter={[18, 18]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} xl={6} key={stat.title}>
            <Card className={`surface-card stat-card ${stat.tone}`}>
              <div className="stat-icon" aria-hidden="true">
                {stat.icon}
              </div>
              <Text type="secondary">{t(stat.title)}</Text>
              <strong>{stat.value}</strong>
              <span>
                {stat.title === 'adminNav.applications' ? (
                  pending > 0 ? t('courses.pendingBadge', { count: pending }) : t('courses.noPending')
                ) : (
                  <>
                    <ArrowUpOutlined /> {t(stat.delta)}
                  </>
                )}
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
                <Text className="section-kicker">{t('dashboard.activity')}</Text>
                <Title level={3}>{t('dashboard.recentUpdates')}</Title>
              </div>
              <Tag color="blue">{t('dashboard.live')}</Tag>
            </div>

            {(applications.data ?? []).slice(0, 5).map((item) => (
              <div className="activity-row" key={item.id}>
                <span className={`activity-dot ${item.status === 'approved' || item.status === 'enrolled' ? 'green' : item.status === 'rejected' ? 'orange' : ''}`} aria-hidden="true" />
                <div>
                  <b>{item.applicantName}</b>
                  <Text type="secondary">{item.course?.title ?? '-'}</Text>
                </div>
                <Text type="secondary">{t(`courses.appStatus.${item.status ?? 'pending'}`)}</Text>
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card className="surface-card dashboard-panel action-panel">
            <Text className="section-kicker">{t('dashboard.atAGlance')}</Text>
            <Title level={3}>{t('dashboard.priorities')}</Title>
            <ul>
              <li>{pending > 0 ? t('courses.waitingReview', { count: pending }) : t('courses.noWaiting')}</li>
              <li>{t('courses.count', { count: courses.data?.filter((c) => !c.isPublished).length ?? 0 })} · {t('common.unpublished')}</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
