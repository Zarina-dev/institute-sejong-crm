import { Typography } from 'antd'
import { useMemo } from 'react'

import type { ChronologyEntry } from './types'

const { Title, Text, Paragraph } = Typography

type ChronologyTimelineProps = {
  entries: ChronologyEntry[]
  /** Drops the descriptions — used where the timeline is a summary. */
  compact?: boolean
}

/** '03' for March, an em dash where the month was never recorded. */
const monthLabel = (entry: ChronologyEntry) => (entry.month ? String(entry.month).padStart(2, '0') : '—')

/**
 * The institute's history as a rail down the page: the year called out once
 * per block, a dot per event, and a heavier dot where the entry is a
 * milestone — so the shape of the story is visible before a word is read.
 */
export function ChronologyTimeline({ entries, compact = false }: ChronologyTimelineProps) {
  // The API sorts; this only cuts the list into blocks so a year is announced once.
  const years = useMemo(() => {
    const byYear = new Map<number, ChronologyEntry[]>()

    for (const entry of entries) {
      byYear.set(entry.year, [...(byYear.get(entry.year) ?? []), entry])
    }

    return [...byYear.entries()]
  }, [entries])

  return (
    <ol className={compact ? 'chronology chronology--compact' : 'chronology'}>
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
                  {entry.description && !compact ? (
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
  )
}
