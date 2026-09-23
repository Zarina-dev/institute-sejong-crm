import { CalendarOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Skeleton, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences } from '../../../app/preferences'
import { usePublishedNews } from '../../../features/news/queries'
import { newsThumbnail } from '../../../features/news/thumbnail'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { formatDate } from '../../../shared/format'
import { PageHeader } from '../../../shared/PageHeader'
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

  const posts = useMemo(
    () => news.data?.filter((post) => (variant === 'press' ? post.category === 'press' : post.category !== 'press')) ?? [],
    [news.data, variant],
  )

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.notices')}
        title={t(variant === 'press' ? 'pageCopy.pressTitle' : 'pageCopy.noticesTitle')}
        description={t(variant === 'press' ? 'pageCopy.pressSubtitle' : 'pageCopy.noticesSubtitle')}
      />

      <ErrorAlert error={news.error} fallback={t('news.loadFailed')} />

      {news.isPending ? (
        <Row gutter={[18, 18]}>
          {Array.from({ length: 3 }, (_, index) => (
            <Col xs={24} md={index === 0 ? 24 : 12} key={index}>
              <Card className="surface-card announcement-card">
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : posts.length > 0 ? (
        <Row gutter={[18, 18]}>
          {posts.map((post) => {
            const thumbnail = newsThumbnail(post)

            return (
              <Col xs={24} md={post.isFeatured ? 24 : 12} key={post.id}>
                <Link to={`/notices/${post.id}`} className="announcement-link">
                  <Card
                    className={`surface-card announcement-card ${post.isFeatured ? 'featured' : ''} ${thumbnail ? 'has-cover' : ''}`}
                    hoverable
                    cover={thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : undefined}
                  >
                    <div className="announcement-meta">
                      <Tag color={post.isFeatured ? 'blue' : 'default'}>{t(`news.category.${post.category}`)}</Tag>
                      <Text type="secondary">
                        <CalendarOutlined /> {formatDate(post.publishedAt ?? post.createdAt, language)}
                      </Text>
                    </div>
                    <Title level={post.isFeatured ? 2 : 3}>{post.title}</Title>
                    <Paragraph type="secondary" className="announcement-excerpt">
                      {richTextExcerpt(post.body, post.isFeatured ? 320 : 180)}
                    </Paragraph>
                    <Text className="announcement-more">{t('common.readMore')} →</Text>
                  </Card>
                </Link>
              </Col>
            )
          })}
        </Row>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('news.empty')} />
        </Card>
      )}
    </div>
  )
}