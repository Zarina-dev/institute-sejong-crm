import { Card, Empty, Skeleton, Typography } from 'antd'

import { usePreferences } from '../../app/preferences'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { RichContent } from '../../shared/RichContent'
import { useSiteContent } from './queries'
import type { ContentSlug } from './api'

const { Title } = Typography

type ContentSectionProps = {
  slug: ContentSlug
  /** Heading shown when the block has no title of its own. */
  fallbackTitle?: string
  /** Shown while the admin has not written this block yet. */
  emptyText?: string
  /** Supplementary blocks render nothing at all until they are written. */
  optional?: boolean
  /** `false` renders the text bare, without the surrounding card. */
  card?: boolean
}

/**
 * One admin-written block of the public site (인사말, FAQ, 교재 안내 …).
 * Missing translations fall back to the institute's default language on the
 * server, so a page is never blank just because one locale is unfilled.
 */
export function ContentSection({ slug, fallbackTitle, emptyText, optional = false, card = true }: ContentSectionProps) {
  const { t } = usePreferences()
  const content = useSiteContent()
  const block = content.data?.[slug]

  // An unwritten optional block is simply absent — no placeholder card.
  if (optional && !content.isPending && !block?.body) {
    return <ErrorAlert error={content.error} fallback={t('content.loadFailed')} />
  }

  const body = content.isPending ? (
    <Skeleton active paragraph={{ rows: 4 }} />
  ) : block?.body ? (
    <>
      {block.title || fallbackTitle ? <Title level={2}>{block.title || fallbackTitle}</Title> : null}
      <RichContent html={block.body} />
    </>
  ) : (
    <Empty description={emptyText} />
  )

  return (
    <>
      <ErrorAlert error={content.error} fallback={t('content.loadFailed')} />
      {card ? <Card className="surface-card content-card">{body}</Card> : body}
    </>
  )
}
