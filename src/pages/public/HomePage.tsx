import { ArrowRightOutlined, CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, SolutionOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Skeleton, Tag, Typography } from 'antd'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { groupCourses } from '../../features/courses/grouping'
import { useCourses, useTimetable } from '../../features/courses/queries'
import { startOfWeek, toIsoDate, weekRange } from '../../features/courses/week'
import { usePublishedNews } from '../../features/news/queries'
import { newsThumbnail } from '../../features/news/thumbnail'
import { formatDate } from '../../shared/format'
import { richTextExcerpt } from '../../shared/richText'

const { Title, Paragraph, Text } = Typography

const MAX_CLASSES_PER_PROGRAMME = 4

function SectionHeading({ kicker, title, aside }: { kicker: string; title: string; aside?: ReactNode }) {
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

/**
 * Landing page: what the institute teaches (live programmes), the next
 * class from the real timetable, and the latest announcements. Nothing on
 * it is static copy that could go stale.
 */
export function HomePage() {
  const { t, language } = usePreferences()
  const news = usePublishedNews(3)
  const courses = useCourses(true)
  const week = useTimetable(useMemo(() => weekRange(startOfWeek(new Date())), []))

  const programmes = useMemo(() => groupCourses(courses.data), [courses.data])

  // First class today or later this week — what "next class" means on a landing page.
  const nextClass = useMemo(() => {
    const today = toIsoDate(new Date())
    const now = new Date().toTimeString().slice(0, 5)
    return (week.data ?? []).find((item) => item.date > today || (item.date === today && item.endTime >= now)) ?? null
  }, [week.data])
  const nextDate = nextClass ? new Date(`${nextClass.date}T00:00:00`) : null
  const dayLong = useMemo(() => new Intl.DateTimeFormat(language, { weekday: 'long', month: 'long', day: 'numeric' }), [language])

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
            {/* Live: the next class on the timetable, not a fixed announcement. */}
            <Card variant="borderless" className="hero-update next-class-card">
              <Text className="update-label">{t('home.nextClass')}</Text>
              {week.isPending ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : nextClass && nextDate ? (
                <>
                  <Title level={3}>{nextClass.courseGroup ? `${nextClass.courseGroup} · ${nextClass.subject}` : nextClass.subject}</Title>
                  <ul className="next-class-facts">
                    <li>
                      <CalendarOutlined /> {dayLong.format(nextDate)}
                    </li>
                    <li>
                      <ClockCircleOutlined /> {nextClass.startTime}–{nextClass.endTime}
                    </li>
                    {nextClass.classroom ? (
                      <li>
                        <EnvironmentOutlined /> {nextClass.classroom}
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : (
                <Title level={3}>{t('schedule.emptyWeek')}</Title>
              )}
              <Link to="/schedule">
                {t('home.fullSchedule')} <ArrowRightOutlined />
              </Link>
            </Card>
          </Col>
        </Row>
      </section>

      <section className="programmes-section">
        <SectionHeading
          kicker={t('nav.courses')}
          title={t('home.programmesTitle')}
          aside={
            <Link to="/courses">
              <Button type="link" icon={<ArrowRightOutlined />} iconPosition="end">
                {t('common.viewAll')}
              </Button>
            </Link>
          }
        />
        <Row gutter={[16, 16]}>
          {courses.isPending
            ? Array.from({ length: 3 }, (_, index) => (
                <Col xs={24} md={8} key={index}>
                  <Card className="surface-card programme-card">
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))
            : programmes.map((programme) => (
                <Col xs={24} md={12} lg={8} key={programme.title}>
                  <Link to="/courses" className="programme-link">
                    <Card className="surface-card programme-card" hoverable>
                      <Title level={3}>{programme.title}</Title>
                      <Text type="secondary">{t('courses.classCount', { count: programme.courses.length })}</Text>
                      <ul className="programme-classes">
                        {programme.courses.slice(0, MAX_CLASSES_PER_PROGRAMME).map((course) => (
                          <li key={course.id}>{course.subject}</li>
                        ))}
                        {programme.courses.length > MAX_CLASSES_PER_PROGRAMME ? <li className="programme-more">…</li> : null}
                      </ul>
                    </Card>
                  </Link>
                </Col>
              ))}
        </Row>
      </section>

      <section className="news-preview">
        <SectionHeading
          kicker={t('home.campusNews')}
          title={t('home.newsTitle')}
          aside={
            <Link to="/news">
              <Button type="link" icon={<ArrowRightOutlined />} iconPosition="end">
                {t('common.viewAll')}
              </Button>
            </Link>
          }
        />
        <Row gutter={[16, 16]}>
          {news.isPending
            ? Array.from({ length: 3 }, (_, index) => (
                <Col xs={24} md={8} key={index}>
                  <Card className="surface-card news-card">
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))
            : (news.data ?? []).map((post) => {
                const thumbnail = newsThumbnail(post)

                return (
                  <Col xs={24} md={8} key={post.id}>
                    <Link to={`/news/${post.id}`} className="announcement-link">
                      <Card className="surface-card news-card" hoverable cover={thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : undefined}>
                        <Text type="secondary" className="news-card__date">
                          {formatDate(post.publishedAt ?? post.createdAt, language)}
                        </Text>
                        <Title level={4}>{post.title}</Title>
                        <Paragraph type="secondary" ellipsis={{ rows: 3 }}>
                          {richTextExcerpt(post.body, 240)}
                        </Paragraph>
                      </Card>
                    </Link>
                  </Col>
                )
              })}
        </Row>
      </section>
    </div>
  )
}
