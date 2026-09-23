import { ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Skeleton, Tag, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'

import { ApiError, assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useNewsPost } from '../../features/news/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { formatDate } from '../../shared/format'
import { RichContent } from '../../shared/RichContent'

const { Title, Text } = Typography

/** One announcement with its full rich-text body. */
export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = usePreferences()
  const post = useNewsPost(id)

  // A draft or a deleted post reads as "not found" to visitors, not as an error.
  const notFound = (post.error instanceof ApiError && post.error.status === 404) || (post.data && !post.data.isPublished)

  return (
    <div className="page-layout article-layout">
      <Link to="/notices" className="article-back">
        <Button type="link" icon={<ArrowLeftOutlined />}>
          {t('news.back')}
        </Button>
      </Link>

      {post.isPending ? (
        <Card className="surface-card article-card">
          <Skeleton active title paragraph={{ rows: 8 }} />
        </Card>
      ) : notFound ? (
        <Card className="surface-card empty-card">
          <Empty description={t('news.notFound')} />
        </Card>
      ) : post.error ? (
        <ErrorAlert error={post.error} fallback={t('news.loadFailed')} />
      ) : post.data ? (
        <article className="surface-card article-card">
          <header className="article-header">
            <div className="announcement-meta">
              <Tag color={post.data.isFeatured ? 'blue' : 'default'}>{t(`news.category.${post.data.category}`)}</Tag>
              <Text type="secondary">
                <CalendarOutlined /> {formatDate(post.data.publishedAt ?? post.data.createdAt, language)}
              </Text>
            </div>
            <Title level={1}>{post.data.title}</Title>
          </header>
          {post.data.coverImage ? <img className="article-cover" src={assetUrl(post.data.coverImage)} alt="" /> : null}
          <RichContent html={post.data.body} className="article-body" />
        </article>
      ) : null}
    </div>
  )
}
