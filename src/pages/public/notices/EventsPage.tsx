import { Card, Empty, Skeleton, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { useEvents } from '../../../features/events/queries'
import type { ScheduleEvent } from '../../../features/events/types'
import { useTerms } from '../../../features/terms/queries'
import { termDisplayName } from '../../../features/terms/labels'
import { TermPicker } from '../../../features/terms/TermPicker'
import type { AcademicTerm } from '../../../features/terms/types'
import { useTermChoice } from '../../../features/terms/useTermChoice'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

const NO_EVENTS: ScheduleEvent[] = []
const NO_TERMS: AcademicTerm[] = []
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

  // The site's semester picker: opens on the semester in progress and greys
  // out the semesters with no events, rather than hiding them.
  const { active: activeTerm, select } = useTermChoice(defined)
  const counts = useMemo(() => {
    const byTerm = new Map<string, number>()

    for (const event of all) {
      if (event.termCode) {
        byTerm.set(event.termCode, (byTerm.get(event.termCode) ?? 0) + 1)
      }
    }

    return byTerm
  }, [all])

  /**
   * An event can fall outside every defined semester (the week before a term
   * opens, say), so the table can always be read whole — 전체 is this page's
   * own entry, not a semester, and is not remembered across pages.
   */
  const [wantAll, setWantAll] = useState(false)
  const showAll = wantAll || !activeTerm

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

      {defined.length > 0 ? (
        <Card className="surface-card filter-card">
          <div className="filter-footer">
            <TermPicker
              terms={defined}
              active={activeTerm}
              onSelect={(code) => {
                setWantAll(false)
                select(code)
              }}
              counts={counts}
              emptyHint={t('terms.noEvents')}
              all={{ label: t('events.allTerms'), selected: showAll, onSelect: () => setWantAll(true) }}
            />

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
            {showAll || !activeTerm ? t('events.allTerms') : termDisplayName(activeTerm, t)}
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
