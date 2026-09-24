import { CalendarOutlined, EnvironmentOutlined, LeftOutlined, RightOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Calendar, Card, Empty, Skeleton, Tag, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { useCourses, useTimetable } from '../../../features/courses/queries'
import { SemesterTable } from '../../../features/courses/SemesterTable'
import type { TimetableEntry } from '../../../features/courses/types'
import { addDays, formatWeekLabel, monthRange, startOfWeek, toIsoDate, weekRange } from '../../../features/courses/week'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Text } = Typography

const TONES = ['blue', 'violet', 'orange'] as const

/** Stable fallback so `useMemo` deps do not see a fresh `[]` every render. */
const NO_ENTRIES: TimetableEntry[] = []

/** Stable colour per subject within a week — same subject, same stripe. */
function toneFor(subject: string, subjects: string[]) {
  return TONES[Math.max(0, subjects.indexOf(subject)) % TONES.length]
}

/**
 * 학사 일정 — the semester note written by the admin, the week's classes on
 * the left and a month calendar on the right. Picking a day in the calendar
 * moves the list to that week; there are no filters, the timetable is small
 * enough to read as it is.
 */
export function CalendarPage() {
  const { t, language } = usePreferences()
  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const [month, setMonth] = useState(() => dayjs())

  const courses = useCourses(true)

  const range = useMemo(() => weekRange(monday), [monday])
  const schedule = useTimetable(range)
  const entries = schedule.data ?? NO_ENTRIES

  // The calendar needs the whole visible month, which is a different range
  // than the week list — one extra query, cached per month.
  const monthQuery = useTimetable(useMemo(() => monthRange(month.year(), month.month()), [month]))

  const countsByDate = useMemo(() => {
    const map = new Map<string, number>()

    for (const item of monthQuery.data ?? []) {
      map.set(item.date, (map.get(item.date) ?? 0) + 1)
    }

    return map
  }, [monthQuery.data])

  const subjects = useMemo(() => [...new Set(entries.map((item) => item.subject))].sort(), [entries])

  const byDay = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>()

    for (const item of entries) {
      map.set(item.date, [...(map.get(item.date) ?? []), item])
    }

    return [...map.entries()]
  }, [entries])

  const dayName = useMemo(() => new Intl.DateTimeFormat(language, { weekday: 'short' }), [language])
  const monthName = useMemo(() => new Intl.DateTimeFormat(language, { month: 'long' }), [language])
  const isCurrentWeek = range.from === weekRange(startOfWeek(new Date())).from
  const weekDays = useMemo(() => new Set(Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(monday, index)))), [monday])

  const selectDate = (value: Dayjs) => {
    setMonday(startOfWeek(value.toDate()))
    setMonth(value)
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.programmes')} title={t('pageCopy.calendarTitle')} description={t('pageCopy.calendarSubtitle')} />

      <ErrorAlert error={schedule.error ?? monthQuery.error ?? courses.error} fallback={t('schedule.loadFailed')} />

      {/* The semester overview the office keeps: one row per class. */}
      <SemesterTable courses={courses.data} loading={courses.isPending} emptyText={t('courses.empty')} />

      <div className="calendar-layout">
        <div className="calendar-layout__week">
          <Card className="surface-card week-bar">
            <div className="week-nav">
              <Button icon={<LeftOutlined />} aria-label={t('schedule.prevWeek')} onClick={() => setMonday(addDays(monday, -7))} />
              <Text strong className="week-label">
                {formatWeekLabel(monday, language)}
              </Text>
              <Button icon={<RightOutlined />} aria-label={t('schedule.nextWeek')} onClick={() => setMonday(addDays(monday, 7))} />
              {!isCurrentWeek ? (
                <Button
                  type="link"
                  onClick={() => {
                    const today = new Date()
                    setMonday(startOfWeek(today))
                    setMonth(dayjs(today))
                  }}
                >
                  {t('schedule.thisWeek')}
                </Button>
              ) : null}
            </div>
            <Text type="secondary">{t('schedule.classesPlanned', { count: entries.length })}</Text>
          </Card>

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
              <Empty description={t('schedule.emptyWeek')} />
            </Card>
          )}
        </div>

        <Card className="surface-card calendar-panel">
          <Calendar
            fullscreen={false}
            value={month}
            onSelect={selectDate}
            onPanelChange={(value) => setMonth(value)}
            className="schedule-calendar"
            /* Days with classes carry a dot; the week shown on the left is tinted. */
            fullCellRender={(value, info) => {
              if (info.type !== 'date') {
                return info.originNode
              }

              const iso = value.format('YYYY-MM-DD')
              const count = countsByDate.get(iso) ?? 0
              const classes = ['calendar-cell', weekDays.has(iso) ? 'in-week' : '', count > 0 ? 'has-classes' : ''].filter(Boolean)

              return (
                <div className={classes.join(' ')} title={count > 0 ? t('schedule.classesPlanned', { count }) : undefined}>
                  <span>{value.date()}</span>
                  {count > 0 ? <i aria-hidden="true" /> : null}
                </div>
              )
            }}
          />
          <Text type="secondary" className="calendar-panel__hint">
            {t('schedule.calendarHint')}
          </Text>
        </Card>
      </div>
    </div>
  )
}
