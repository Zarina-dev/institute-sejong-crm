import { Card, Empty, Skeleton, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { CompetitionCard } from '../../features/competitions/CompetitionCard'
import { CompetitionKindFilter } from '../../features/competitions/KindSelect'
import { ALL_KINDS, competitionKindsInUse } from '../../features/competitions/kinds'
import { usePublishedCompetitions } from '../../features/competitions/queries'
import type { Competition, CompetitionKind } from '../../features/competitions/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'
import { ALL_YEARS, YearSelect } from '../../shared/YearSelect'

const { Title, Text } = Typography

const NO_RECORDS: Competition[] = []

/**
 * 학당 발자취 › 행사·대회 — every event the institute keeps a record of, one
 * kind of record: 개강식, 역사 탐방 and 한국 음식 체험 as much as 말하기 대회.
 * A contest simply carries its participants and results as well. Read a year
 * at a time, opening on the latest; 구분 narrows it to one kind of event,
 * offering only the kinds that have something to show.
 */
export function HistoryPage() {
  const { t } = usePreferences()
  const records = usePublishedCompetitions()
  const all = records.data ?? NO_RECORDS

  const kindOptions = useMemo(() => competitionKindsInUse(all, t), [all, t])
  const [kind, setKind] = useState<CompetitionKind>(ALL_KINDS)
  const ofKind = useMemo(() => (kind === ALL_KINDS ? all : all.filter((record) => record.kind === kind)), [all, kind])

  const years = useMemo(() => [...new Set(ofKind.map((record) => record.year))].sort((a, b) => b - a), [ofKind])
  const [pickedYear, setPickedYear] = useState<string | null>(null)

  // The latest year with something, unless the visitor chose another (or
  // 전체); a year the 구분 filter has emptied falls back to the latest too.
  const year =
    pickedYear === ALL_YEARS || (pickedYear && years.includes(Number(pickedYear))) ? pickedYear : years.length ? String(years[0]) : ALL_YEARS

  const groups = useMemo(() => {
    const byYear = new Map<number, Competition[]>()

    for (const record of ofKind) {
      if (year !== ALL_YEARS && record.year !== Number(year)) continue

      const bucket = byYear.get(record.year)

      if (bucket) {
        bucket.push(record)
      } else {
        byYear.set(record.year, [record])
      }
    }

    return [...byYear.entries()].sort((a, b) => b[0] - a[0])
  }, [ofKind, year])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('siteNav.historyRecords')} description={t('pageCopy.historySubtitle')} />

      <ErrorAlert error={records.error} fallback={t('competitions.loadFailed')} />

      {records.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      ) : all.length === 0 ? (
        <Card className="surface-card empty-card">
          <Empty description={t('competitions.empty')} />
        </Card>
      ) : (
        <>
          <Card className="surface-card filter-card">
            <div className="gallery-filters">
              <div>
                <Text>{t('pageCopy.historyKind')}</Text>
                <CompetitionKindFilter value={kind} onChange={setKind} options={kindOptions} />
              </div>
              <div className="gallery-filters__years">
                <Text>{t('gallery.year')}</Text>
                {/* A dropdown, like every other year picker on the site: the list grows every year. */}
                <YearSelect years={years} value={year === ALL_YEARS ? null : year} onChange={setPickedYear} allowAll />
              </div>
            </div>
          </Card>

          {groups.length === 0 ? (
            <Card className="surface-card empty-card">
              <Empty description={t('competitions.empty')} />
            </Card>
          ) : (
            <div className="course-groups">
              {groups.map(([groupYear, items]) => (
                <section className="course-group history-year" key={groupYear} aria-labelledby={`history-${groupYear}`}>
                  <div className="course-group__heading">
                    <Title level={2} id={`history-${groupYear}`}>
                      {groupYear}
                    </Title>
                    <Text type="secondary">{t('competitions.count', { count: items.length })}</Text>
                  </div>
                  <div className="competition-list">
                    {items.map((record) => (
                      <CompetitionCard record={record} key={record.id} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
