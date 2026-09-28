import { CalendarOutlined, EnvironmentOutlined, LeftOutlined, RightOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Segmented, Skeleton, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { useCourses, useTimetable } from '../../../features/courses/queries'
import { SemesterTable } from '../../../features/courses/SemesterTable'
import { courseTerm } from '../../../features/courses/terms'
import type { TimetableEntry } from '../../../features/courses/types'
import { addDays, startOfWeek, toIsoDate, weekRange } from '../../../features/courses/week'
import { useTerms } from '../../../features/terms/queries'
import type { AcademicTerm } from '../../../features/terms/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { formatDate } from '../../../shared/format'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Text } = Typography

const TONES = ['blue', 'violet', 'orange'] as const

/** Stable fallback so `useMemo` deps do not see a fresh `[]` every render. */
const NO_ENTRIES: TimetableEntry[] = []
const NO_TERMS: AcademicTerm[] = []

/** Stable colour per subject within a day — same subject, same stripe. */
function toneFor(subject: string, subjects: string[]) {
  return TONES[Math.max(0, subjects.indexOf(subject)) % TONES.length]
}

/**
 * 학사 일정 — the semester sheet for the term the visitor picks, and under it
 * 시간표 as a section of its own: today's classes by default, with the days
 * of the week to click through. The semesters on offer are the ones the
 * institute defined in 학기 관리; nothing here guesses at dates.
 */
export function CalendarPage() {
  const { t, language } = usePreferences()

  const courses = useCourses(true)
  const terms = useTerms()
  const defined = terms.data ?? NO_TERMS

  const today = toIsoDate(new Date())

  /* ------------------------------- 학기 ------------------------------- */

  const years = useMemo(() => [...new Set(defined.map((term) => String(term.year)))].sort().reverse(), [defined])

  // The term in progress, else the most recent one the institute defined.
  const fallbackTerm = useMemo(
    () => defined.find((term) => term.startDate <= today && today <= term.endDate) ?? defined[0] ?? null,
    [defined, today],
  )

  const [selected, setSelected] = useState<string | null>(null)
  const activeTerm = defined.find((term) => term.code === selected) ?? fallbackTerm
  const halvesOfYear = useMemo(() => defined.filter((term) => String(term.year) === String(activeTerm?.year)), [activeTerm?.year, defined])

  const termCourses = useMemo(
    () => (activeTerm ? (courses.data ?? []).filter((course) => courseTerm(course) === activeTerm.code) : courses.data),
    [activeTerm, courses.data],
  )

  /* ------------------------------ 시간표 ------------------------------ */

  // Today by default; the day strip walks a week at a time from there.
  const [day, setDay] = useState(today)
  const [monday, setMonday] = useState(() => startOfWeek(new Date()))

  const week = useMemo(() => weekRange(monday), [monday])
  const schedule = useTimetable(week)
  const entries = schedule.data ?? NO_ENTRIES

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(monday, index))), [monday])
  const countByDate = useMemo(() => {
    const counts = new Map<string, number>()

    for (const entry of entries) {
      counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1)
    }

    return counts
  }, [entries])

  const dayEntries = useMemo(() => entries.filter((entry) => entry.date === day), [day, entries])
  const subjects = useMemo(() => [...new Set(dayEntries.map((entry) => entry.subject))].sort(), [dayEntries])

  const dayName = useMemo(() => new Intl.DateTimeFormat(language, { weekday: 'short' }), [language])
  const isToday = day === today

  const goToWeek = (offset: number) => {
    const next = addDays(monday, offset)
    setMonday(next)
    setDay(toIsoDate(next))
  }

  const backToToday = () => {
    setMonday(startOfWeek(new Date()))
    setDay(today)
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.programmes')} title={t('pageCopy.calendarTitle')} description={t('pageCopy.calendarSubtitle')} />

      <ErrorAlert error={schedule.error ?? courses.error ?? terms.error} fallback={t('schedule.loadFailed')} />

      {defined.length > 0 ? (
        <Card className="surface-card filter-card">
          <div className="filter-footer">
            <div className="term-picker">
              {years.length > 1 ? (
                <Segmented
                  aria-label={t('terms.year')}
                  value={String(activeTerm?.year ?? years[0])}
                  onChange={(value) => {
                    // Keep the same half of the year where that year has one.
                    const ofYear = defined.filter((term) => String(term.year) === String(value))
                    const next = ofYear.find((term) => term.half === activeTerm?.half) ?? ofYear[0]

                    if (next) {
                      setSelected(next.code)
                    }
                  }}
                  options={years.map((value) => ({ value, label: t('terms.yearLabel', { year: value }) }))}
                />
              ) : null}

              {halvesOfYear.length > 1 ? (
                <Segmented
                  aria-label={t('terms.label')}
                  value={activeTerm?.code}
                  onChange={(value) => setSelected(String(value))}
                  options={halvesOfYear.map((term) => ({
                    value: term.code,
                    label: term.name || t(term.half === 1 ? 'terms.first' : 'terms.second'),
                  }))}
                />
              ) : null}
            </div>

            {activeTerm ? (
              <Text type="secondary">
                {formatDate(activeTerm.startDate, language)} ~ {formatDate(activeTerm.endDate, language)} ·{' '}
                {t('courses.classCount', { count: termCourses?.length ?? 0 })}
              </Text>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* The semester sheet the office keeps: one row per class. */}
      <SemesterTable courses={termCourses} loading={courses.isPending} emptyText={t('courses.empty')} />

      {/* 시간표 — its own section, opening on today. */}
      <section className="timetable-section" aria-labelledby="timetable-heading">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">{t('siteNav.programmes')}</Text>
            <Title level={2} id="timetable-heading">
              {t('schedule.timetable')}
            </Title>
          </div>
          {!isToday ? <Button type="link" onClick={backToToday}>{t('schedule.today')}</Button> : null}
        </div>

        <Card className="surface-card day-picker">
          <Button icon={<LeftOutlined />} aria-label={t('schedule.prevWeek')} onClick={() => goToWeek(-7)} />

          <div className="day-picker__days">
            {days.map((date) => {
              const value = new Date(`${date}T00:00:00`)
              const count = countByDate.get(date) ?? 0

              return (
                <button
                  type="button"
                  key={date}
                  className={`day-chip${date === day ? ' is-active' : ''}${date === today ? ' is-today' : ''}`}
                  aria-pressed={date === day}
                  onClick={() => setDay(date)}
                >
                  <span>{dayName.format(value)}</span>
                  <strong>{value.getDate()}</strong>
                  {count > 0 ? <i aria-hidden="true" /> : null}
                </button>
              )
            })}
          </div>

          <Button icon={<RightOutlined />} aria-label={t('schedule.nextWeek')} onClick={() => goToWeek(7)} />
        </Card>

        <div className="schedule-day-head">
          <Title level={3}>{formatDate(day, language)}</Title>
          <Text type="secondary">{t('schedule.classesPlanned', { count: dayEntries.length })}</Text>
        </div>

        {schedule.isPending ? (
          <Card className="surface-card">
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        ) : dayEntries.length > 0 ? (
          <div className={schedule.isFetching ? 'is-refreshing' : undefined}>
            {dayEntries.map((item) => (
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
          </div>
        ) : (
          <Card className="surface-card empty-card">
            <Empty description={t('schedule.emptyDay')} />
          </Card>
        )}
      </section>
    </div>
  )
}
