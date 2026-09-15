import { CalendarOutlined, EnvironmentOutlined, FilterOutlined, LeftOutlined, RightOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Row, Select, Skeleton, Space, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useSchedule } from '../../features/schedule/queries'
import type { ScheduleEntry } from '../../features/schedule/types'
import { addDays, formatWeekLabel, startOfWeek, weekRange } from '../../features/schedule/week'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Title, Text } = Typography

const TONES = ['blue', 'violet', 'orange'] as const

/** Stable fallback so `useMemo` deps do not see a fresh `[]` every render. */
const NO_ENTRIES: ScheduleEntry[] = []

/** Stable colour per subject within a week — same subject, same stripe. */
function toneFor(subject: string, subjects: string[]) {
  return TONES[Math.max(0, subjects.indexOf(subject)) % TONES.length]
}

export function SchedulePage() {
  const { t, language } = usePreferences()
  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const [group, setGroup] = useState<string>()
  const [subject, setSubject] = useState<string>()

  const range = useMemo(() => weekRange(monday), [monday])
  // Filters are applied client-side on the week's data, so the option lists
  // always reflect what exists that week and one query serves every combination.
  const schedule = useSchedule(range)
  const entries = schedule.data ?? NO_ENTRIES

  const { groups, subjects } = useMemo(() => {
    const g = new Set<string>()
    const s = new Set<string>()
    for (const item of entries) {
      if (item.courseGroup) g.add(item.courseGroup)
      s.add(item.subject)
    }
    return { groups: [...g].sort(), subjects: [...s].sort() }
  }, [entries])

  const filtered = useMemo(
    () => entries.filter((item) => (!group || item.courseGroup === group) && (!subject || item.subject === subject)),
    [entries, group, subject],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>()
    for (const item of filtered) {
      map.set(item.date, [...(map.get(item.date) ?? []), item])
    }
    return [...map.entries()]
  }, [filtered])

  const dayName = useMemo(() => new Intl.DateTimeFormat(language, { weekday: 'short' }), [language])
  const monthName = useMemo(() => new Intl.DateTimeFormat(language, { month: 'long' }), [language])
  const filtersActive = Boolean(group || subject)
  const isCurrentWeek = range.from === weekRange(startOfWeek(new Date())).from

  const resetFilters = () => {
    setGroup(undefined)
    setSubject(undefined)
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('schedule.kicker')} title={t('pages.scheduleTitle')} description={t('pages.scheduleSubtitle')} />

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={8}>
            <Text strong>{t('schedule.week')}</Text>
            <div className="week-nav">
              <Button icon={<LeftOutlined />} aria-label={t('schedule.prevWeek')} onClick={() => setMonday(addDays(monday, -7))} />
              <Text strong className="week-label">{formatWeekLabel(monday, language)}</Text>
              <Button icon={<RightOutlined />} aria-label={t('schedule.nextWeek')} onClick={() => setMonday(addDays(monday, 7))} />
              {!isCurrentWeek ? (
                <Button type="link" onClick={() => setMonday(startOfWeek(new Date()))}>
                  {t('schedule.thisWeek')}
                </Button>
              ) : null}
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t('schedule.group')}</Text>
            <Select
              allowClear
              value={group}
              onChange={setGroup}
              placeholder={t('schedule.allGroups')}
              options={groups.map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>{t('schedule.subject')}</Text>
            <Select
              allowClear
              value={subject}
              onChange={setSubject}
              placeholder={t('schedule.allSubjects')}
              options={subjects.map((value) => ({ value, label: value }))}
            />
          </Col>
        </Row>
        <div className="filter-footer">
          <Text type="secondary">
            <FilterOutlined /> {t('schedule.classesShown', { count: filtered.length })}
          </Text>
          {filtersActive ? (
            <Button type="link" onClick={resetFilters}>
              {t('common.resetFilters')}
            </Button>
          ) : null}
        </div>
      </Card>

      <ErrorAlert error={schedule.error} fallback={t('schedule.loadFailed')} />

      {schedule.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : byDay.length > 0 ? (
        <div className={schedule.isFetching ? 'is-refreshing' : undefined}>
          {byDay.map(([date, items]) => {
            const day = new Date(`${date}T00:00:00`)

            return (
              <section className="schedule-list" key={date}>
                <div className="schedule-date">
                  <span>{dayName.format(day)}</span>
                  <strong>{day.getDate()}</strong>
                  <div>
                    <b>{monthName.format(day)}</b>
                    <Text type="secondary">{t('schedule.classesPlanned', { count: items.length })}</Text>
                  </div>
                </div>
                {items.map((item) => (
                  <Card className={`surface-card lesson-card ${toneFor(item.subject, subjects)}`} key={item.id}>
                    <div className="lesson-time">
                      <CalendarOutlined />
                      {item.startTime} – {item.endTime}
                    </div>
                    <div className="lesson-main">
                      {item.courseGroup ? <Tag>{item.courseGroup}</Tag> : null}
                      <Title level={4}>{item.subject}</Title>
                      {item.teacher ? (
                        <span>
                          <UserOutlined /> {item.teacher}
                        </span>
                      ) : null}
                    </div>
                    <div className="lesson-room">
                      <EnvironmentOutlined />
                      <span>
                        <Text type="secondary">{t('schedule.room')}</Text>
                        <b>{item.classroom ?? '-'}</b>
                      </span>
                    </div>
                  </Card>
                ))}
              </section>
            )
          })}
        </div>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={filtersActive ? t('schedule.empty') : t('schedule.emptyWeek')}>
            <Space>
              {filtersActive ? <Button onClick={resetFilters}>{t('schedule.showAll')}</Button> : null}
              {!isCurrentWeek ? <Button onClick={() => setMonday(startOfWeek(new Date()))}>{t('schedule.thisWeek')}</Button> : null}
            </Space>
          </Empty>
        </Card>
      )}
    </div>
  )
}
