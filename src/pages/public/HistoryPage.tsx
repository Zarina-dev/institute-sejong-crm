import { CalendarOutlined, PictureOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Select, Skeleton, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { usePublishedAlbums } from '../../features/gallery/queries'
import type { GalleryAlbum } from '../../features/gallery/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'
import { PhotoCarousel } from '../../shared/PhotoCarousel'
import { ALL_YEARS, YearSelect } from '../../shared/YearSelect'

const { Title, Text } = Typography

const NO_ALBUMS: GalleryAlbum[] = []
const ALL = 'all'

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

/** 학당 발자취 — event albums grouped by year, filtered by year and event. */
export function HistoryPage() {
  const { t } = usePreferences()
  const albums = usePublishedAlbums()
  const [pickedYear, setPickedYear] = useState<string | null>(null)
  const [tag, setTag] = useState<string>(ALL)

  const list = albums.data ?? NO_ALBUMS

  const years = useMemo(() => [...new Set(list.map((album) => album.year))].sort((a, b) => b - a), [list])
  const tags = useMemo(() => [...new Set(list.map((album) => album.eventTag))], [list])

  // Opens on the latest year, as 대회 기록 does: every album of every year at
  // once is hundreds of photo cards before the visitor has chosen anything.
  // 전체 is still one choice away.
  const year = pickedYear ?? (years.length ? String(years[0]) : ALL_YEARS)

  const byYear = useMemo(() => {
    const filtered = list.filter((album) => (year === ALL_YEARS || album.year === Number(year)) && (tag === ALL || album.eventTag === tag))
    const map = new Map<number, GalleryAlbum[]>()

    for (const album of filtered) {
      const bucket = map.get(album.year)

      if (bucket) {
        bucket.push(album)
      } else {
        map.set(album.year, [album])
      }
    }

    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [list, tag, year])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('pageCopy.historyTitle')} description={t('pageCopy.historySubtitle')} />


      <ErrorAlert error={albums.error} fallback={t('gallery.loadFailed')} />

      {albums.isPending ? (
        <Row gutter={[18, 18]} className="card-grid">
          {Array.from({ length: 3 }, (_, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card className="surface-card album-card">
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : list.length === 0 ? (
        <Card className="surface-card empty-card">
          <Empty description={t('gallery.empty')} />
        </Card>
      ) : (
        <>
          <Card className="surface-card filter-card">
            <div className="gallery-filters">
              <div>
                <Text>{t('gallery.event')}</Text>
                <Select
                  value={tag}
                  onChange={setTag}
                  style={{ minWidth: 220 }}
                  options={[{ value: ALL, label: t('gallery.allTags') }, ...tags.map((value) => ({ value, label: t(`gallery.tags.${value}`) }))]}
                />
              </div>
              <div className="gallery-filters__years">
                <Text>{t('gallery.year')}</Text>
                {/* A dropdown, like every other year picker on the site: the list grows every year. */}
                <YearSelect years={years} value={year === ALL_YEARS ? null : year} onChange={setPickedYear} allowAll />
              </div>
            </div>
          </Card>

          {byYear.length === 0 ? (
            <Card className="surface-card empty-card">
              <Empty description={t('gallery.empty')} />
            </Card>
          ) : (
            <div className="course-groups">
              {byYear.map(([albumYear, items]) => (
                <section className="course-group" key={albumYear} aria-labelledby={`gallery-${albumYear}`}>
                  <div className="course-group__heading">
                    <Title level={2} id={`gallery-${albumYear}`}>
                      {albumYear}
                    </Title>
                    <Text type="secondary">{t('gallery.albumCount', { count: items.length })}</Text>
                  </div>
                  <Row gutter={[18, 18]} className="card-grid">
                    {items.map((album) => (
                      <Col xs={24} sm={12} lg={8} key={album.id}>
                        <AlbumCard album={album} />
                      </Col>
                    ))}
                  </Row>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}