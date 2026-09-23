import { CalendarOutlined, PictureOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Segmented, Select, Skeleton, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { ContentSection } from '../../features/content/ContentSection'
import { usePublishedAlbums } from '../../features/gallery/queries'
import type { GalleryAlbum } from '../../features/gallery/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

const NO_ALBUMS: GalleryAlbum[] = []
const ALL = 'all'

function AlbumCard({ album }: { album: GalleryAlbum }) {
  const { t } = usePreferences()

  const body = (
    <Card
      className="surface-card album-card"
      hoverable={Boolean(album.albumUrl)}
      cover={
        album.coverImage ? (
          <img src={assetUrl(album.coverImage)} alt="" loading="lazy" />
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
      {album.description ? (
        <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
          {album.description}
        </Paragraph>
      ) : null}
      <Text className="album-card__link">{album.albumUrl ? `${t('gallery.openAlbum')} →` : t('gallery.noLink')}</Text>
    </Card>
  )

  // Photos live in Google Photos, so the card is an external link when set.
  return album.albumUrl ? (
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
  // Segmented works with strings; the year is parsed back when filtering.
  const [year, setYear] = useState<string>(ALL)
  const [tag, setTag] = useState<string>(ALL)

  const list = albums.data ?? NO_ALBUMS

  const years = useMemo(() => [...new Set(list.map((album) => album.year))].sort((a, b) => b - a), [list])
  const tags = useMemo(() => [...new Set(list.map((album) => album.eventTag))], [list])

  const byYear = useMemo(() => {
    const filtered = list.filter((album) => (year === ALL || album.year === Number(year)) && (tag === ALL || album.eventTag === tag))
    const map = new Map<number, GalleryAlbum[]>()

    for (const album of filtered) {
      map.set(album.year, [...(map.get(album.year) ?? []), album])
    }

    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [list, tag, year])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.history')} title={t('pageCopy.historyTitle')} description={t('pageCopy.historySubtitle')} />

      <ContentSection slug="history.intro" optional />

      <ErrorAlert error={albums.error} fallback={t('gallery.loadFailed')} />

      {albums.isPending ? (
        <Row gutter={[18, 18]}>
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
                <Segmented
                  value={year}
                  onChange={(value) => setYear(String(value))}
                  options={[{ value: ALL, label: t('gallery.allYears') }, ...years.map((value) => ({ value: String(value), label: String(value) }))]}
                />
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
                  <Row gutter={[18, 18]}>
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