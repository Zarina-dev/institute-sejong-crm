import { ArrowUpOutlined, BookOutlined, CalendarOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Skeleton, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences, type TranslationKey } from '../../app/preferences'
import { useApplications, useCourses } from '../../features/courses/queries'
import { useRecentActivity, type ActivityKind } from '../../features/dashboard/useRecentActivity'
import { useMaterials } from '../../features/materials/queries'
import { useStudents } from '../../features/students/queries'
import { formatRelativeTime } from '../../shared/format'

const { Title, Text } = Typography

/** Which admin menu each feed entry belongs to. */
const KIND_LABEL: Record<ActivityKind, TranslationKey> = {
  student: 'adminNav.students',
  course: 'adminNav.courses',
  application: 'adminNav.applications',
  material: 'adminNav.materials',
  news: 'adminNav.news',
  staff: 'adminNav.staff',
}

type Stat = { title: TranslationKey; value: number | string; delta: TranslationKey; icon: ReactNode; tone: 'blue' | 'violet' | 'orange' | 'green' }

/**
 * Admin landing. The four counters are live (same queries the admin pages
 * use, so they are already cached once any of those pages was opened); the
 * activity feed merges the newest rows of every admin-managed table.
 */
export function DashboardPage() {
  const { t, language } = usePreferences()
  const activity = useRecentActivity()
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

            {activity.isPending && activity.entries.length === 0 ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : activity.entries.length === 0 ? (
              <Empty description={t('dashboard.activityEmpty')} />
            ) : (
              activity.entries.map((entry) => (
                <Link className="activity-row" to={entry.to} key={entry.id}>
                  <span className={`activity-dot ${entry.created ? 'green' : ''}`} aria-hidden="true" />
                  <div>
                    <b>{entry.title}</b>
                    <Text type="secondary">
                      <Tag className="activity-kind">{t(KIND_LABEL[entry.kind])}</Tag>
                      {entry.detailKey ? t(entry.detailKey) : entry.detail}
                    </Text>
                  </div>
                  <Text type="secondary" className="activity-when">
                    {t(entry.created ? 'dashboard.created' : 'dashboard.updated')} · {formatRelativeTime(entry.at, language, t('dashboard.justNow'))}
                  </Text>
                </Link>
              ))
            )}
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
