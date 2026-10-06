import { CalendarOutlined, EnvironmentOutlined, PictureOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
import { Card, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { formatDate } from '../../shared/format'
import { PhotoCarousel } from '../../shared/PhotoCarousel'
import { RichContent } from '../../shared/RichContent'
import { competitionKindColour, competitionKindLabel } from './kinds'
import type { Competition, CompetitionWinner } from './types'

const { Title, Text } = Typography

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
 * One running of a competition: its photos, the facts, the summary and the
 * results table. Shown on 학당 발자취 beside the event albums of the same year.
 */
export function CompetitionCard({ record }: { record: Competition }) {
  const { t, language } = usePreferences()
  const photos = [record.coverImage, ...(record.images ?? [])].filter((image): image is string => Boolean(image))

  return (
    <Card className="surface-card competition-card">
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
}
