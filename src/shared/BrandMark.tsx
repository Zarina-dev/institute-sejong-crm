import { memo } from 'react'

/**
 * The King Sejong Institute symbol (the ㅅ/ㅎ mark from the Foundation's CI),
 * served from /public so the same file is also the favicon. The wordmark next
 * to it is text from i18n, because the institute name is localized.
 */
export const BrandMark = memo(function BrandMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <span className={['brand-mark', className].filter(Boolean).join(' ')} style={{ width: size, height: size }} aria-hidden="true">
      <img src="/ksi-symbol.svg" alt="" width={Math.round(size * 0.72)} height={Math.round(size * 0.72)} draggable={false} />
    </span>
  )
})
