import {
  BookOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FolderOpenOutlined,
  NotificationOutlined,
  PictureOutlined,
  PlusOutlined,
  ReadOutlined,
  RightOutlined,
  SolutionOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Button, Card, Empty, Skeleton, Tag, Typography } from 'antd'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { contact, phoneHref } from '../../app/contact'
import { usePreferences, type TranslationKey } from '../../app/preferences'
import { groupCourses } from '../../features/courses/grouping'
import { useCourses, useTimetable } from '../../features/courses/queries'
import { startOfWeek, toIsoDate, weekRange } from '../../features/courses/week'
import { usePublishedNews } from '../../features/news/queries'
import { useTerms } from '../../features/terms/queries'
import type { AcademicTerm } from '../../features/terms/types'
import { termInProgress } from '../../features/terms/current'
import { formatDate } from '../../shared/format'

const { Title, Paragraph, Text } = Typography

const MAX_CLASSES_PER_PROGRAMME = 4
const NO_TERMS: AcademicTerm[] = []

/** 바로가기 — the six places visitors actually go, one tap from the top. */
const QUICK_LINKS: Array<{ to: string; label: TranslationKey; icon: ReactNode }> = [
  { to: '/programmes', label: 'siteNav.programmesCourses', icon: <SolutionOutlined /> },
  { to: '/programmes/calendar', label: 'siteNav.programmesCalendar', icon: <CalendarOutlined /> },
  { to: '/notices', label: 'siteNav.noticesNotice', icon: <NotificationOutlined /> },
  { to: '/resources', label: 'siteNav.resourcesTextbooks', icon: <BookOutlined /> },
  { to: '/resources/materials', label: 'siteNav.resourcesMaterials', icon: <FolderOpenOutlined /> },
  { to: '/history', label: 'siteNav.historyAlbums', icon: <PictureOutlined /> },
]

/** A Korean-style section head: rule, title on the left, 더보기 on the right. */
function SectionHead({ title, to, label }: { title: string; to?: string; label?: string }) {
  return (
    <div className="board-head">
      <Title level={2}>{title}</Title>
      {to && label ? (
        <Link className="more-link" to={to} aria-label={label}>
          <PlusOutlined />
          <span>{label}</span>
        </Link>
      ) : null}
    </div>
  )
}

/**
 * The landing page, laid out the way institute sites are read here: a key
 * visual, 바로가기 tiles, then the boards — 공지사항 beside this week's
 * classes — and the programmes on offer. Everything on it is live data;
 * nothing is copy that could go stale.
 */
export function HomePage() {
  const { t, language } = usePreferences()
  const news = usePublishedNews(6)
  // "On offer" means the semester in progress — always, whatever a visitor
  // last picked on 강좌 안내; this section has no picker of its own.
  const terms = useTerms()
  const currentTerm = useMemo(() => termInProgress(terms.data ?? NO_TERMS) ?? terms.data?.[0] ?? null, [terms.data])
  const courses = useCourses(true, { term: currentTerm?.code }, !terms.isPending)
  const week = useTimetable(useMemo(() => weekRange(startOfWeek(new Date())), []))

  const programmes = useMemo(() => groupCourses(courses.data), [courses.data])
  const notices = (news.data ?? []).filter((post) => post.category !== 'press').slice(0, 5)

  const today = toIsoDate(new Date())
  const now = new Date().toTimeString().slice(0, 5)

  /** Today's remaining classes, else the next day that has any. */
  const upcoming = useMemo(() => {
    const entries = week.data ?? []
    const todays = entries.filter((item) => item.date === today && item.endTime >= now)

    if (todays.length > 0) {
      return { date: today, items: todays }
    }

    const next = entries.find((item) => item.date > today)
    return next ? { date: next.date, items: entries.filter((item) => item.date === next.date) } : null
  }, [now, today, week.data])

  /** Posted within the last week — worth a NEW badge on a notice board. */
  const isNew = (date: string) => Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <div className="home-page">
      {/* ---- Key visual ---- */}
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <Tag className="hero-tag">{t('home.heroTag')}</Tag>
          <Title level={1} className="hero-title">
            {t('home.heroTitle')}
          </Title>
          <Paragraph className="hero-copy">{t('home.heroCopy')}</Paragraph>
          <div className="hero-actions">
            <Link to="/programmes">
              <Button type="primary" size="large" icon={<SolutionOutlined />}>
                {t('home.explore')}
              </Button>
            </Link>
            <a href={phoneHref}>
              <Button className="hero-secondary" size="large" icon={<TeamOutlined />}>
                {t('home.enquire')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ---- 바로가기 ---- */}
      <nav className="quick-links" aria-label={t('home.quickLinks')}>
        {QUICK_LINKS.map((link) => (
          <Link className="quick-link" to={link.to} key={link.to}>
            <span className="quick-link__icon" aria-hidden="true">
              {link.icon}
            </span>
            <span>{t(link.label)}</span>
          </Link>
        ))}
      </nav>

      {/* ---- 공지사항 · 이번 주 수업 ---- */}
      <section className="board-grid">
        <Card className="surface-card board">
          <SectionHead title={t('pages.newsTitle')} to="/notices" label={t('home.more')} />

          {news.isPending ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : notices.length > 0 ? (
            <ul className="notice-board">
              {notices.map((post) => (
                <li key={post.id}>
                  <Link to={`/notices/${post.id}`}>
                    <span className="notice-board__title" title={post.title}>
                      <span className="notice-board__text">{post.title}</span>
                      {isNew(post.publishedAt ?? post.createdAt) ? <em className="badge-new">NEW</em> : null}
                    </span>
                    <time>{formatDate(post.publishedAt ?? post.createdAt, language)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty description={t('news.empty')} />
          )}
        </Card>

        <Card className="surface-card board">
          <SectionHead title={t('schedule.timetable')} to="/programmes/calendar" label={t('home.more')} />

          {week.isPending ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : upcoming ? (
            <>
              <Text className="board-date">{formatDate(upcoming.date, language)}</Text>
              <ul className="class-board">
                {upcoming.items.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <span className="class-board__time">
                      <ClockCircleOutlined /> {item.startTime}–{item.endTime}
                    </span>
                    <span className="class-board__name">
                      <strong>{item.subject}</strong>
                      {item.teacher ? <Text type="secondary">{item.teacher}</Text> : null}
                    </span>
                    {item.classroom?.trim() ? (
                      <span className="class-board__room" title={item.classroom.trim()}>
                        {item.classroom.trim()}
                      </span>
                    ) : (
                      <span className="class-board__room is-unset">{t('schedule.roomUnset')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty description={t('schedule.emptyWeek')} />
          )}
        </Card>
      </section>

      {/* ---- 개설 과정 ---- */}
      <section className="programmes-section">
        <SectionHead title={t('home.programmesTitle')} to="/programmes" label={t('home.more')} />

        {courses.isPending ? (
          <div className="programme-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <Card className="surface-card programme-card" key={index}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </div>
        ) : (
          <div className="programme-grid">
            {programmes.map((programme) => {
              // Culture programmes live on their own page.
              const isCulture = programme.courses.every((course) => course.category === 'culture')

              return (
                <Link className="programme-link" to={isCulture ? '/programmes/culture' : '/programmes'} key={programme.title}>
                  <Card className="surface-card programme-card" hoverable>
                    <div className="programme-card__head">
                      <Title level={3}>{programme.title}</Title>
                      <RightOutlined />
                    </div>
                    <Text type="secondary">{t('courses.classCount', { count: programme.courses.length })}</Text>
                    <ul className="programme-classes">
                      {programme.courses.slice(0, MAX_CLASSES_PER_PROGRAMME).map((course) => (
                        <li key={course.id}>{course.subject}</li>
                      ))}
                      {programme.courses.length > MAX_CLASSES_PER_PROGRAMME ? <li className="programme-more">…</li> : null}
                    </ul>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ---- 이용 안내 ---- */}
      <section className="info-strip">
        <div>
          <span className="info-strip__icon" aria-hidden="true">
            <EnvironmentOutlined />
          </span>
          <div>
            <Text strong>{t('about.contactKicker')}</Text>
            <Text type="secondary">{contact.address}</Text>
          </div>
        </div>
        <div>
          <span className="info-strip__icon" aria-hidden="true">
            <ReadOutlined />
          </span>
          <div>
            <Text strong>{t('home.tuitionTitle')}</Text>
            <Text type="secondary">{t('home.tuitionText')}</Text>
          </div>
        </div>
        <div>
          <span className="info-strip__icon" aria-hidden="true">
            <TeamOutlined />
          </span>
          <div>
            <Text strong>{t('home.enquireTitle')}</Text>
            <a href={phoneHref}>{contact.phone}</a>
          </div>
        </div>
      </section>
    </div>
  )
}
