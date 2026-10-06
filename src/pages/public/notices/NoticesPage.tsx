import { CalendarOutlined, LinkOutlined, PushpinFilled, ReadOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Card, Drawer, Empty, Skeleton, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences } from '../../../app/preferences'
import { usePublishedNews } from '../../../features/news/queries'
import { newsThumbnail } from '../../../features/news/thumbnail'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { formatDate } from '../../../shared/format'
import { PageHeader } from '../../../shared/PageHeader'
import { RichContent } from '../../../shared/RichContent'
import { richTextExcerpt } from '../../../shared/richText'

const { Title, Paragraph, Text } = Typography

type NoticesPageProps = {
  /** `press` is 보도 자료; everything else is 공지사항. */
  variant: 'notice' | 'press'
}

/** 알림마당 — the same list rendered for announcements and for press coverage. */
export function NoticesPage({ variant }: NoticesPageProps) {
  const { t, language } = usePreferences()
  const news = usePublishedNews()

  const [openId, setOpenId] = useState<string | null>(null)

  const posts = useMemo(
    () => news.data?.filter((post) => (variant === 'press' ? post.category === 'press' : post.category !== 'press')) ?? [],
    [news.data, variant],
  )

  const open = posts.find((post) => post.id === openId) ?? null

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.notices')}
        title={t(variant === 'press' ? 'pageCopy.pressTitle' : 'pageCopy.noticesTitle')}
        description={t(variant === 'press' ? 'pageCopy.pressSubtitle' : 'pageCopy.noticesSubtitle')}
      />

      <ErrorAlert error={news.error} fallback={t('news.loadFailed')} />

      {/* A notice board is read by scanning dates and titles, so the posts are
          rows of one shape — thumbnail, meta, title, lede — rather than cards
          that change size with the length of what was written. */}
      {news.isPending ? (
        <div className="notice-list">
          {Array.from({ length: 4 }, (_, index) => (
            <Card className="surface-card notice-row" key={index}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="notice-list">
          {posts.map((post) => {
            const thumbnail = newsThumbnail(post)

            return (
              <button
                type="button"
                className={`notice-row surface-card ant-card${thumbnail ? '' : ' notice-row--bare'}`}
                key={post.id}
                aria-haspopup="dialog"
                onClick={() => setOpenId(post.id)}
              >
                <span className="notice-row__media">
                  {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : <ReadOutlined aria-hidden="true" />}
                </span>

                <span className="notice-row__body">
                  <span className="notice-row__meta">
                    {post.isFeatured ? (
                      <Tag color="blue" icon={<PushpinFilled />}>
                        {t('news.featured')}
                      </Tag>
                    ) : null}
                    <Tag>{t(`news.category.${post.category}`)}</Tag>
                    <Text type="secondary">
                      <CalendarOutlined /> {formatDate(post.publishedAt ?? post.createdAt, language)}
                    </Text>
                  </span>

                  <Title level={3}>{post.title}</Title>
                  <Paragraph type="secondary" className="notice-row__excerpt">
                    {richTextExcerpt(post.body, 200)}
                  </Paragraph>
                </span>

                <RightOutlined className="notice-row__chevron" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('news.empty')} />
        </Card>
      )}

      {/* Reading a notice should not lose the board: it opens beside it.
          The article page stays for links shared from outside. */}
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        width={680}
        className="notice-drawer"
        title={open?.title}
        extra={
          open ? (
            <Link to={`/notices/${open.id}`}>
              <Button icon={<LinkOutlined />}>{t('news.openPage')}</Button>
            </Link>
          ) : null
        }
      >
        {open ? (
          <article className="notice-detail">
            <div className="notice-detail__meta">
              {open.isFeatured ? (
                <Tag color="blue" icon={<PushpinFilled />}>
                  {t('news.featured')}
                </Tag>
              ) : null}
              <Tag>{t(`news.category.${open.category}`)}</Tag>
              <Text type="secondary">
                <CalendarOutlined /> {formatDate(open.publishedAt ?? open.createdAt, language)}
              </Text>
            </div>

            {newsThumbnail(open) ? <img className="notice-detail__cover" src={newsThumbnail(open) ?? undefined} alt="" /> : null}

            <RichContent html={open.body} />
          </article>
        ) : null}
      </Drawer>
    </div>
  )
}