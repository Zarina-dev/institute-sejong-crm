import { useMemo } from 'react'

import { sanitizeRichHtml } from './richText'

type RichContentProps = {
  html: string
  className?: string
}

/** Renders stored rich text (news bodies, staff bios) after DOMPurify. */
export function RichContent({ html, className }: RichContentProps) {
  const safeHtml = useMemo(() => sanitizeRichHtml(html), [html])

  return <div className={className ? `rich-content ${className}` : 'rich-content'} dangerouslySetInnerHTML={{ __html: safeHtml }} />
}
