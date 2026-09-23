import { AppstoreOutlined, BookOutlined, IdcardOutlined, NotificationOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Skeleton, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences, type TranslationKey } from '../../app/preferences'
import { groupCourses } from '../../features/courses/grouping'
import { useCourses } from '../../features/courses/queries'
import { useRecentActivity, type ActivityKind } from '../../features/dashboard/useRecentActivity'
import { useMaterials } from '../../features/materials/queries'
import { useAllNews } from '../../features/news/queries'
import { useAllStaff } from '../../features/staff/queries'
import { formatRelativeTime } from '../../shared/format'

const { Title, Text } = Typography

/** Which admin menu each feed entry belongs to. */
const KIND_LABEL: Record<ActivityKind, TranslationKey> = {
  course: 'adminNav.courses',
  material: 'adminNav.materials',
  news: 'adminNav.news',
  staff: 'adminNav.staff',
}

type Stat = {
  title: TranslationKey
  value: number | string
  hint: string
  icon: ReactNode
  tone: 'blue' | 'violet' | 'orange' | 'green'
  to: string
}

/**
 * Admin landing: one counter per managed area (the same queries those pages
 * use, so they are already cached once any of them was opened) and a feed
 * that merges the newest rows of every table.
 */
export function DashboardPage() {
  const { t, language } = usePreferences()
  const activity = useRecentActivity()
  const courses = useCourses(false)
  const materials = useMaterials({ page: 1, limit: 1, published: 'all' })
  const news = useAllNews()
  const staff = useAllStaff()

  const programmes = groupCourses(courses.data).length
  const drafts = (courses.data ?? []).filter((course) => !course.isPublished).length
  const unpublishedNews = (news.data ?? []).filter((post) => !post.isPublished).length
  const hiddenStaff = (staff.data ?? []).filter((member) => !member.isPublished).length

  const stats: Stat[] = [
    {
      title: 'adminNav.courses',
      value: courses.data?.length ?? '…',
      hint: t('dashboard.programmeCount', { count: programmes }),
      icon: <AppstoreOutlined />,
      tone: 'violet',
      to: '/admin/courses',
    },
    {
      title: 'adminNav.materials',
      value: materials.data?.total ?? '…',
      hint: t('dashboard.statResourcesDelta'),
      icon: <BookOutlined />,
      tone: 'green',
      to: '/admin/materials',
    },
    {
      title: 'adminNav.news',
      value: news.data?.length ?? '…',
      hint: unpublishedNews > 0 ? t('dashboard.draftCount', { count: unpublishedNews }) : t('common.published'),
      icon: <NotificationOutlined />,
      tone: 'blue',
      to: '/admin/news',
    },
    {
      title: 'adminNav.staff',
      value: staff.data?.length ?? '…',
      hint: hiddenStaff > 0 ? t('dashboard.hiddenCount', { count: hiddenStaff }) : t('common.published'),
      icon: <IdcardOutlined />,
      tone: 'orange',
      to: '/admin/staff',
    },
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
            <Link to={stat.to}>
              <Card className={`surface-card stat-card ${stat.tone}`}>
                <div className="stat-icon" aria-hidden="true">
                  {stat.icon}
                </div>
                <Text type="secondary">{t(stat.title)}</Text>
                <strong>{stat.value}</strong>
                <span>{stat.hint}</span>
              </Card>
            </Link>
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
              <li>{drafts > 0 ? t('dashboard.draftCourses', { count: drafts }) : t('dashboard.allCoursesPublished')}</li>
              <li>{unpublishedNews > 0 ? t('dashboard.draftNews', { count: unpublishedNews }) : t('dashboard.allNewsPublished')}</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
