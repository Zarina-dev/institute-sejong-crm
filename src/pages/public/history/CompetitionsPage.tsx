import { CalendarOutlined, EnvironmentOutlined, PictureOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
import { Card, Empty, Skeleton, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { CompetitionKindFilter } from '../../../features/competitions/KindSelect'
import { ALL_KINDS, competitionKindColour, competitionKindLabel, competitionKindsInUse } from '../../../features/competitions/kinds'
import { usePublishedCompetitions } from '../../../features/competitions/queries'
import type { Competition, CompetitionKind, CompetitionWinner } from '../../../features/competitions/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { formatDate } from '../../../shared/format'
import { PageHeader } from '../../../shared/PageHeader'
import { PhotoCarousel } from '../../../shared/PhotoCarousel'
import { RichContent } from '../../../shared/RichContent'
import { YearSelect } from '../../../shared/YearSelect'

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
 * 대회 기록 — 말하기 대회 and 백일장 in one place, because they are the same
 * kind of record and the institute keeps them together: pick the competition
 * and the year, and every edition held then is listed newest first.
 */
export function CompetitionsPage() {
  const { t, language } = usePreferences()
  const competitions = usePublishedCompetitions()
  const all = competitions.data ?? NO_RECORDS

  const kindOptions = useMemo(() => competitionKindsInUse(all, t), [all, t])
  const [kind, setKind] = useState<CompetitionKind>(ALL_KINDS)
  const ofKind = useMemo(() => (kind === ALL_KINDS ? all : all.filter((record) => record.kind === kind)), [all, kind])

  const years = useMemo(() => [...new Set(ofKind.map((record) => record.year))].sort((a, b) => b - a), [ofKind])
  const [year, setYear] = useState<number | null>(null)
  const activeYear = year != null && years.includes(year) ? year : years[0] ?? null
  const records = useMemo(() => ofKind.filter((record) => record.year === activeYear), [activeYear, ofKind])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('competitions.title')} description={t('competitions.subtitle')} />

      <ErrorAlert error={competitions.error} fallback={t('competitions.loadFailed')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <CompetitionKindFilter value={kind} onChange={setKind} options={kindOptions} />

          <Space size={12}>
            {years.length > 1 ? <YearSelect years={years} value={activeYear} onChange={(value) => setYear(Number(value))} /> : null}
            <Text type="secondary">{t('competitions.count', { count: records.length })}</Text>
          </Space>
        </div>
      </Card>

      {competitions.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      ) : records.length > 0 ? (
        <div className="competition-list">
          {records.map((record) => {
            const photos = [record.coverImage, ...(record.images ?? [])].filter((image): image is string => Boolean(image))

            return (
              <Card className="surface-card competition-card" key={record.id}>
                <div className="competition-card__head">
                  {/* One frame whatever the photos are: they slide, the layout does not. */}
                  <PhotoCarousel images={photos} label={record.title} />

                  <div>
                    <span className="competition-card__tags">
                      <Tag className="competition-card__year">{record.year}</Tag>
                      <Tag color={competitionKindColour(record.kind)}>{competitionKindLabel(record.kind, t)}</Tag>
                    </span>
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
            )
          })}
        </div>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('competitions.empty')} />
        </Card>
      )}
    </div>
  )
}
