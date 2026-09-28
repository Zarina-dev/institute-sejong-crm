import { Typography } from 'antd'
import { memo, type ReactNode } from 'react'

import { Breadcrumbs } from './Breadcrumbs'
import { useBreadcrumbTrail } from './useBreadcrumbTrail'

const { Title, Text } = Typography

type PageHeaderProps = {
  /** Small uppercase eyebrow, e.g. "ADMIN". */
  kicker?: string
  title: ReactNode
  description?: ReactNode
  /** Right-hand slot for a primary action or a status indicator. */
  extra?: ReactNode
  /** Public/admin pages use h1; nested portal pages use h2. */
  level?: 1 | 2
}

/**
 * The one page heading: the trail, the title, and an optional action.
 *
 * Public pages carry 홈 › 학당 소개 › 인사말 above the title, as sites here do;
 * the kicker then stands down, because the trail already names the section.
 * Admin routes are not in the public menu, so they get no trail and keep
 * their kicker.
 */
export const PageHeader = memo(function PageHeader({ kicker, title, description, extra, level = 1 }: PageHeaderProps) {
  const trail = useBreadcrumbTrail()

  return (
    <header className="page-heading">
      <Breadcrumbs trail={trail} />
      {kicker && trail.length === 0 ? <Text className="section-kicker">{kicker}</Text> : null}
      <div className="page-heading-row">
        <Title level={level}>{title}</Title>
        {extra}
      </div>
      {description ? <Text>{description}</Text> : null}
    </header>
  )
})
