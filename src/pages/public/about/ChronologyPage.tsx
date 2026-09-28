import { Card, Empty, Skeleton, Typography } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../../app/preferences'
import { useChronology } from '../../../features/chronology/queries'
import type { ChronologyEntry } from '../../../features/chronology/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Text, Paragraph } = Typography

const NO_ENTRIES: ChronologyEntry[] = []

/** '03' for March, an em dash where the month was never recorded. */
const monthLabel = (entry: ChronologyEntry) => (entry.month ? String(entry.month).padStart(2, '0') : '—')

/**
 * 연혁 — the institute's history as a timeline: a rail down the page, the
 * year called out once at the top of its block, and one line per event. A
 * milestone (개원, 인증, 이전 …) is drawn heavier so the shape of the
 * institute's story is visible before a word is read.
 */
export function ChronologyPage() {
  const { t } = usePreferences()
  const chronology = useChronology()
  const entries = chronology.data ?? NO_ENTRIES

  // Newest year first — the API already sorts, this only cuts the list into
  // blocks so each year is announced once.
  const years = useMemo(() => {
    const byYear = new Map<number, ChronologyEntry[]>()

    for (const entry of entries) {
      byYear.set(entry.year, [...(byYear.get(entry.year) ?? []), entry])
    }

    return [...byYear.entries()]
  }, [entries])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.about')} title={t('chronology.title')} description={t('chronology.subtitle')} />

      <ErrorAlert error={chronology.error} fallback={t('chronology.loadFailed')} />

      {chronology.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : years.length > 0 ? (
        <Card className="surface-card chronology-card">
          <ol className="chronology">
            {years.map(([year, yearEntries]) => (
              <li className="chronology__year" key={year}>
                <Title level={2} className="chronology__year-label">
                  {year}
                </Title>

                <ol className="chronology__entries">
                  {yearEntries.map((entry) => (
                    <li className={`chronology__entry${entry.isMilestone ? ' is-milestone' : ''}`} key={entry.id}>
                      <span className="chronology__month">{monthLabel(entry)}</span>

                      <div className="chronology__body">
                        <Text className="chronology__title">{entry.title}</Text>
                        {entry.description ? (
                          <Paragraph type="secondary" className="chronology__description">
                            {entry.description}
                          </Paragraph>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('chronology.empty')} />
        </Card>
      )}
    </div>
  )
}
