import { CalendarOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Skeleton, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { usePublishedNews } from '../../features/news/queries'
import { newsThumbnail } from '../../features/news/thumbnail'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { richTextExcerpt } from '../../shared/richText'

const { Title, Paragraph, Text } = Typography

export function NewsPage() {
  const { t, language } = usePreferences()
  const news = usePublishedNews()

  return (
    <div className="page-layout">
      <PageHeader kicker={t('news.kicker')} title={t('pages.newsTitle')} description={t('pages.newsSubtitle')} />

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
      ) : news.data && news.data.length > 0 ? (
        <Row gutter={[18, 18]}>
          {news.data.map((post) => {
            const thumbnail = newsThumbnail(post)

            return (
              <Col xs={24} md={post.isFeatured ? 24 : 12} key={post.id}>
                <Link to={`/news/${post.id}`} className="announcement-link">
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
