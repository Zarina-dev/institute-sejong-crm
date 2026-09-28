import { Card, Empty, Skeleton } from 'antd'

import { usePreferences } from '../../../app/preferences'
import { ChronologyTimeline } from '../../../features/chronology/ChronologyTimeline'
import { useChronology } from '../../../features/chronology/queries'
import type { ChronologyEntry } from '../../../features/chronology/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const NO_ENTRIES: ChronologyEntry[] = []

/** 연혁 — the whole history, year by year. */
export function ChronologyPage() {
  const { t } = usePreferences()
  const chronology = useChronology()
  const entries = chronology.data ?? NO_ENTRIES

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.about')} title={t('chronology.title')} description={t('chronology.subtitle')} />

      <ErrorAlert error={chronology.error} fallback={t('chronology.loadFailed')} />

      {chronology.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : entries.length > 0 ? (
        <Card className="surface-card chronology-card">
          <ChronologyTimeline entries={entries} />
        </Card>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('chronology.empty')} />
        </Card>
      )}
    </div>
  )
}
