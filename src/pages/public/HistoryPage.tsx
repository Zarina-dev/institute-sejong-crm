import { CalendarOutlined, PictureOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Select, Skeleton, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { CompetitionCard } from '../../features/competitions/CompetitionCard'
import { usePublishedCompetitions } from '../../features/competitions/queries'
import type { Competition } from '../../features/competitions/types'
import { usePublishedAlbums } from '../../features/gallery/queries'
import type { GalleryAlbum } from '../../features/gallery/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'
import { PhotoCarousel } from '../../shared/PhotoCarousel'
import { ALL_YEARS, YearSelect } from '../../shared/YearSelect'

const { Title, Text } = Typography

const NO_ALBUMS: GalleryAlbum[] = []
const NO_COMPETITIONS: Competition[] = []

function AlbumCard({ album }: { album: GalleryAlbum }) {
  const { t } = usePreferences()

  // Photos the institute uploaded itself; the cover leads them.
  const photos = [album.coverImage, ...(album.images ?? [])].filter((image): image is string => Boolean(image))

  /**
   * With photos of its own the card holds a carousel, so it must not also be
   * one big external link — the arrows would navigate away instead of paging.
   */
  const linked = Boolean(album.albumUrl) && photos.length <= 1

  const body = (
    <Card
      className="surface-card album-card"
      hoverable={linked}
      cover={
        photos.length > 1 ? (
          <PhotoCarousel images={photos} label={album.title} />
        ) : photos.length === 1 ? (
          <img src={assetUrl(photos[0])} alt="" loading="lazy" />
        ) : (
          <div className="album-card__placeholder" aria-hidden="true">
            <PictureOutlined />
          </div>
        )
      }
    >
      <div className="album-card__meta">
        <Tag color="blue">{t(`gallery.tags.${album.eventTag}`)}</Tag>
        <Text type="secondary">
          <CalendarOutlined /> {album.heldOn ?? album.year}
        </Text>
      </div>
      <Title level={4}>{album.title}</Title>
      {/* Clamped in CSS: Paragraph's `ellipsis` forces a layout per card. */}
      {album.description ? (
        <p className="album-card__description" title={album.description}>
          {album.description}
        </p>
      ) : null}
      {album.albumUrl ? (
        linked ? (
          <Text className="album-card__link">{`${t('gallery.openAlbum')} →`}</Text>
        ) : (
          <a className="album-card__link" href={album.albumUrl} target="_blank" rel="noopener noreferrer">
            {`${t('gallery.openAlbum')} →`}
          </a>
        )
      ) : photos.length === 0 ? (
        <Text className="album-card__link">{t('gallery.noLink')}</Text>
      ) : null}
    </Card>
  )

  // Without its own photos the whole card is the way to the external album.
  return linked && album.albumUrl ? (
    <a href={album.albumUrl} target="_blank" rel="noopener noreferrer" className="album-link">
      {body}
    </a>
  ) : (
    body
  )
}

/** What the page lists: both, or one of the two records. */
type Show = 'all' | 'competitions' | 'albums'

type YearGroup = { year: number; competitions: Competition[]; albums: GalleryAlbum[] }

/**
 * 학당 발자취 › 행사·대회 — the institute's events and competitions in one
 * place, read a year at a time. A competition and the photos of the day
 * belong to the same story, so a year shows its competitions (with their
 * results) and then its event albums, instead of two pages that split it.
 * Opens on the latest year; 구분 narrows it to one of the two.
 */
export function HistoryPage() {
  const { t } = usePreferences()
  const albums = usePublishedAlbums()
  const competitions = usePublishedCompetitions()
  const [show, setShow] = useState<Show>('all')
  const [pickedYear, setPickedYear] = useState<string | null>(null)

  const albumList = show === 'competitions' ? NO_ALBUMS : (albums.data ?? NO_ALBUMS)
  const competitionList = show === 'albums' ? NO_COMPETITIONS : (competitions.data ?? NO_COMPETITIONS)

  const years = useMemo(
    () => [...new Set([...albumList.map((album) => album.year), ...competitionList.map((record) => record.year)])].sort((a, b) => b - a),
    [albumList, competitionList],
  )

  // The latest year that has something, unless the visitor chose another
  // (or 전체); a choice that the 구분 filter has emptied falls back too.
  const year =
    pickedYear === ALL_YEARS || (pickedYear && years.includes(Number(pickedYear))) ? pickedYear : years.length ? String(years[0]) : ALL_YEARS

  const groups = useMemo(() => {
    const byYear = new Map<number, YearGroup>()
    const groupOf = (value: number) => {
      const existing = byYear.get(value)

      if (existing) {
        return existing
      }

      const created: YearGroup = { year: value, competitions: [], albums: [] }
      byYear.set(value, created)
      return created
    }

    const inYear = (value: number) => year === ALL_YEARS || value === Number(year)

    for (const record of competitionList) {
      if (inYear(record.year)) groupOf(record.year).competitions.push(record)
    }

    for (const album of albumList) {
      if (inYear(album.year)) groupOf(album.year).albums.push(album)
    }

    return [...byYear.values()].sort((a, b) => b.year - a.year)
  }, [albumList, competitionList, year])

  const pending = albums.isPending || competitions.isPending
  const nothingAtAll = !pending && !(albums.data?.length || competitions.data?.length)

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('siteNav.historyRecords')} description={t('pageCopy.historySubtitle')} />

      <ErrorAlert error={albums.error ?? competitions.error} fallback={t('gallery.loadFailed')} />

      {pending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
      ) : nothingAtAll ? (
        <Card className="surface-card empty-card">
          <Empty description={t('gallery.empty')} />
        </Card>
      ) : (
        <>
          <Card className="surface-card filter-card">
            <div className="gallery-filters">
              <div>
                <Text>{t('pageCopy.historyKind')}</Text>
                <Select
                  className="history-kind"
                  value={show}
                  onChange={setShow}
                  options={[
                    { value: 'all', label: t('competitions.allKinds') },
                    { value: 'competitions', label: t('siteNav.historyCompetitions') },
                    { value: 'albums', label: t('siteNav.historyAlbums') },
                  ]}
                />
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
              <Empty description={t('gallery.empty')} />
            </Card>
          ) : (
            <div className="course-groups">
              {groups.map((group) => (
                <section className="course-group history-year" key={group.year} aria-labelledby={`history-${group.year}`}>
                  <div className="course-group__heading">
                    <Title level={2} id={`history-${group.year}`}>
                      {group.year}
                    </Title>
                  </div>

                  {group.competitions.length > 0 ? (
                    <div className="history-block">
                      <div className="history-block__head">
                        <Text className="section-kicker">{t('siteNav.historyCompetitions')}</Text>
                        <Text type="secondary">{t('competitions.count', { count: group.competitions.length })}</Text>
                      </div>
                      <div className="competition-list">
                        {group.competitions.map((record) => (
                          <CompetitionCard record={record} key={record.id} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {group.albums.length > 0 ? (
                    <div className="history-block">
                      <div className="history-block__head">
                        <Text className="section-kicker">{t('siteNav.historyAlbums')}</Text>
                        <Text type="secondary">{t('gallery.albumCount', { count: group.albums.length })}</Text>
                      </div>
                      <Row gutter={[18, 18]} className="card-grid">
                        {group.albums.map((album) => (
                          <Col xs={24} sm={12} lg={8} key={album.id}>
                            <AlbumCard album={album} />
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
