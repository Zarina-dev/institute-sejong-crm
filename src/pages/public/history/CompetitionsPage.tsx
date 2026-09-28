import { CalendarOutlined, EnvironmentOutlined, PictureOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
import { Card, Empty, Skeleton, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'

import { assetUrl } from '../../../api/client'
import { usePreferences } from '../../../app/preferences'
import { useCompetitions } from '../../../features/competitions/queries'
import type { Competition, CompetitionKind, CompetitionWinner } from '../../../features/competitions/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { formatDate } from '../../../shared/format'
import { PageHeader } from '../../../shared/PageHeader'
import { YearSelect } from '../../../shared/YearSelect'
import { RichContent } from '../../../shared/RichContent'

const { Title, Text } = Typography

const NO_RECORDS: Competition[] = []

/** 1·2·3위 get a colour; the rest stay neutral. */
const RANK_COLOUR = ['gold', 'silver', '#cd7f32'] as const

function Winners({ winners }: { winners: CompetitionWinner[] }) {
  const { t } = usePreferences()

  const columns = useMemo<NonNullable<TableProps<CompetitionWinner>['columns']>>(
    () => [
      {
        title: t('competitions.rank'),
        dataIndex: 'rank',
        key: 'rank',
        width: 96,
        render: (rank: number) => (
          <Tag color={RANK_COLOUR[rank - 1] ?? 'default'} icon={rank <= 3 ? <TrophyOutlined /> : undefined}>
            {t('competitions.rankLabel', { rank })}
          </Tag>
        ),
      },
      { title: t('competitions.form.winnerName'), dataIndex: 'name', key: 'name', render: (name: string) => <strong>{name}</strong> },
      {
        title: t('competitions.form.winnerNote'),
        dataIndex: 'note',
        key: 'note',
        responsive: ['sm'],
        render: (note: string | null) => note || <Text type="secondary">—</Text>,
      },
    ],
    [t],
  )

  if (winners.length === 0) {
    return <Text type="secondary">{t('competitions.noWinners')}</Text>
  }

  return (
    <Table
      className="admin-table competition-winners"
      columns={columns}
      dataSource={winners}
      rowKey={(winner) => `${winner.rank}-${winner.name}`}
      pagination={false}
      size="small"
    />
  )
}

/**
 * 말하기 대회 · 백일장 대회 — one section per edition, newest first: the
 * facts of the day, what the institute wrote about it, and the results.
 */
export function CompetitionsPage({ kind }: { kind: CompetitionKind }) {
  const { t, language } = usePreferences()
  const competitions = useCompetitions(kind)
  const all = competitions.data ?? NO_RECORDS

  // Editions are read one year at a time, newest first.
  const years = useMemo(() => [...new Set(all.map((record) => record.year))].sort((a, b) => b - a), [all])
  const [year, setYear] = useState<number | null>(null)
  const activeYear = year != null && years.includes(year) ? year : years[0] ?? null
  const records = useMemo(() => all.filter((record) => record.year === activeYear), [activeYear, all])

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.history')}
        title={t(kind === 'speech' ? 'competitions.speechTitle' : 'competitions.writingTitle')}
        description={t(kind === 'speech' ? 'competitions.speechSubtitle' : 'competitions.writingSubtitle')}
      />

      <ErrorAlert error={competitions.error} fallback={t('competitions.loadFailed')} />

      {years.length > 1 ? (
        <Card className="surface-card filter-card">
          <div className="filter-footer">
            <YearSelect years={years} value={activeYear} onChange={(value) => setYear(Number(value))} />
            <Text type="secondary">{t('competitions.count', { count: records.length })}</Text>
          </div>
        </Card>
      ) : null}

      {competitions.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      ) : records.length > 0 ? (
        <div className="competition-list">
          {records.map((record) => (
            <Card className="surface-card competition-card" key={record.id}>
              <div className="competition-card__head">
                {record.coverImage ? <img className="competition-card__cover" src={assetUrl(record.coverImage)} alt="" loading="lazy" /> : null}

                <div>
                  <Tag className="competition-card__year">{record.year}</Tag>
                  <Title level={3}>{record.title}</Title>

                  <ul className="competition-card__facts">
                    {record.heldOn ? (
                      <li>
                        <CalendarOutlined /> {formatDate(record.heldOn, language)}
                      </li>
                    ) : null}
                    {record.venue ? (
                      <li>
                        <EnvironmentOutlined /> {record.venue}
                      </li>
                    ) : null}
                    {record.participants != null ? (
                      <li>
                        <TeamOutlined /> {t('competitions.participants')} {record.participants}
                      </li>
                    ) : null}
                    {record.albumUrl ? (
                      <li>
                        <PictureOutlined />{' '}
                        <a href={record.albumUrl} target="_blank" rel="noopener noreferrer">
                          {t('competitions.album')}
                        </a>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>

              {record.summary ? <RichContent className="competition-card__summary" html={record.summary} /> : null}

              <div className="competition-card__winners">
                <Text className="section-kicker">{t('competitions.winners')}</Text>
                <Winners winners={record.winners} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('competitions.empty')} />
        </Card>
      )}
    </div>
  )
}
