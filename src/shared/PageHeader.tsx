import { Typography } from 'antd'
import { memo, type ReactNode } from 'react'

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
 * The one page heading. Before this, public/admin pages used
 * `.page-heading` with an h1 and the student portal used a bare h2 with a
 * different rhythm — same app, two headers.
 */
export const PageHeader = memo(function PageHeader({
  kicker,
  title,
  description,
  extra,
  level = 1,
}: PageHeaderProps) {
  return (
    <header className="page-heading">
      {kicker ? <Text className="section-kicker">{kicker}</Text> : null}
      <div className="page-heading-row">
        <Title level={level}>{title}</Title>
        {extra}
      </div>
      {description ? <Text>{description}</Text> : null}
    </header>
  )
})
