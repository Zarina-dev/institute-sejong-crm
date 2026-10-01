import { Card, Empty, Segmented, Skeleton, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { useEvents } from '../../../features/events/queries'
import type { ScheduleEvent } from '../../../features/events/types'
import { useTerms } from '../../../features/terms/queries'
import type { AcademicTerm, TermKind } from '../../../features/terms/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'
import { YearSelect } from '../../../shared/YearSelect'

const { Text } = Typography

const NO_EVENTS: ScheduleEvent[] = []
const NO_TERMS: AcademicTerm[] = []
const ALL = 'all'

const KIND_LABEL: Record<TermKind, 'terms.first' | 'terms.second' | 'terms.breakKind'> = {
  first: 'terms.first',
  second: 'terms.second',
  break: 'terms.breakKind',
}

/** Weekday names in both scripts, the way the printed table carries them. */
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
const WEEKDAY_KY = ['Жекшем', 'Дүй', 'Шейш', 'Шарш', 'Бейш', 'Жума', 'Ишем']

const dayOf = (date: string) => new Date(`${date}T00:00:00`)

/**
 * 행사 일정 — the semester's events as the institute prints them: 월 · 날짜 ·
 * 요일 · 행사명, with the Kyrgyz name beside the Korean one. The month, the
 * day span and the weekday are read off the dates, so "9–13" and "월–금"
 * cannot drift apart from them.
 */
export function EventsPage() {
  const { t } = usePreferences()
  const events = useEvents()
  const terms = useTerms()

  const all = events.data ?? NO_EVENTS
  const defined = terms.data ?? NO_TERMS

  // Only semesters that actually have events are worth offering.
  const withEvents = useMemo(() => new Set(all.map((event) => event.termCode).filter(Boolean)), [all])
  const options = useMemo(() => defined.filter((term) => withEvents.has(term.code)), [defined, withEvents])

  const today = new Date().toISOString().slice(0, 10)
  const current = options.find((term) => term.startDate <= today && today <= term.endDate) ?? null

  const [selected, setSelected] = useState<string | null>(null)
  const activeTerm = selected === ALL ? null : options.find((term) => term.code === selected) ?? current

  /**
   * An event can fall outside every defined semester (the week before a term
   * opens, say), so the table can always be read whole.
   */
  const showAll = selected === ALL || !activeTerm

  const years = useMemo(() => [...new Set(options.map((term) => String(term.year)))].sort().reverse(), [options])
  const termsOfYear = useMemo(() => options.filter((term) => String(term.year) === String(activeTerm?.year)), [activeTerm?.year, options])

  const rows = useMemo(
    () => (showAll ? all : all.filter((event) => event.termCode === activeTerm?.code)),
    [activeTerm?.code, all, showAll],
  )

  const columns = useMemo<NonNullable<TableProps<ScheduleEvent>['columns']>>(
    () => [
      {
        title: (
          <span className="event-table__head">
            <strong>월</strong>
            <small>Ай</small>
          </span>
        ),
        key: 'month',
        width: 72,
        align: 'center',
        render: (_, event) => dayOf(event.startDate).getMonth() + 1,
      },
      {
        title: (
          <span className="event-table__head">
            <strong>날짜</strong>
            <small>Күнү</small>
          </span>
        ),
        key: 'day',
        width: 96,
        align: 'center',
        render: (_, event) => {
          const from = dayOf(event.startDate).getDate()
          const to = event.endDate ? dayOf(event.endDate).getDate() : null

          return to && to !== from ? `${from}–${to}` : from
        },
      },
      {
        title: (
          <span className="event-table__head">
            <strong>요일</strong>
            <small>Жуманын күнү</small>
          </span>
        ),
        key: 'weekday',
        width: 118,
        align: 'center',
        render: (_, event) => {
          const from = dayOf(event.startDate).getDay()
          const to = event.endDate ? dayOf(event.endDate).getDay() : null
          const span = to != null && to !== from

          return (
            <span className="event-table__weekday">
              <strong>{span ? `${WEEKDAY_KO[from]}–${WEEKDAY_KO[to]}` : WEEKDAY_KO[from]}</strong>
              <small>{span ? `${WEEKDAY_KY[from]}–${WEEKDAY_KY[to]}` : WEEKDAY_KY[from]}</small>
            </span>
          )
        },
      },
      {
        title: <strong>행사명</strong>,
        key: 'title',
        render: (_, event) => (
          <span className="event-table__name">
            <strong>{event.title}</strong>
            {event.note ? <Text type="secondary">{event.note}</Text> : null}
          </span>
        ),
      },
      {
        title: <strong>Иш-чаранын аталышы</strong>,
        key: 'titleKy',
        render: (_, event) => event.titleKy || <Text type="secondary">—</Text>,
      },
    ],
    [],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.notices')} title={t('events.title')} description={t('events.subtitle')} />

      <ErrorAlert error={events.error ?? terms.error} fallback={t('events.loadFailed')} />

      {options.length > 0 ? (
        <Card className="surface-card filter-card">
          <div className="filter-footer">
            <div className="term-picker">
              {years.length > 1 ? (
                <YearSelect
                  years={years}
                  value={activeTerm?.year ?? years[0]}
                  onChange={(value) => {
                    const ofYear = options.filter((term) => String(term.year) === value)
                    const next = ofYear.find((term) => term.kind === activeTerm?.kind) ?? ofYear[0]

                    if (next) {
                      setSelected(next.code)
                    }
                  }}
                />
              ) : null}

              <Segmented
                aria-label={t('terms.label')}
                value={showAll ? ALL : activeTerm?.code}
                onChange={(value) => setSelected(String(value))}
                options={[
                  { value: ALL, label: t('events.allTerms') },
                  ...termsOfYear.map((term) => ({ value: term.code, label: term.name || t(KIND_LABEL[term.kind]) })),
                ]}
              />
            </div>

            <Text type="secondary">{t('events.count', { count: rows.length })}</Text>
          </div>
        </Card>
      ) : null}

      {events.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : rows.length > 0 ? (
        <Card className="surface-card">
          <Text className="event-table__caption">
            {showAll ? t('events.allTerms') : activeTerm?.name || `${activeTerm?.year} · ${t(KIND_LABEL[activeTerm?.kind ?? 'first'])}`}
          </Text>

          <Table
            className="admin-table event-table"
            columns={columns}
            dataSource={rows}
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('events.empty')} />
        </Card>
      )}
    </div>
  )
}
