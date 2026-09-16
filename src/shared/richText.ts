import DOMPurify from 'dompurify'

import { assetUrl } from '../api/client'

/**
 * Rich text is stored with *site-relative* image paths (`/uploads/images/…`)
 * so the content survives a change of API host. The browser needs absolute
 * URLs, so paths are expanded at render time and collapsed again on save.
 */
const ASSET_ORIGIN = assetUrl('/').replace(/\/$/, '')
const RELATIVE_SRC = /(<img\b[^>]*\bsrc=")(\/uploads\/[^"]+)(")/g
const ABSOLUTE_SRC = new RegExp(`(<img\\b[^>]*\\bsrc=")${ASSET_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\/uploads\\/[^"]+)(")`, 'g')

export function expandAssetUrls(html: string) {
  return html.replace(RELATIVE_SRC, (_, before: string, path: string, after: string) => `${before}${assetUrl(path)}${after}`)
}

export function collapseAssetUrls(html: string) {
  return html.replace(ABSOLUTE_SRC, '$1$2$3')
}

const HAS_MARKUP = /<[a-z][\s\S]*>/i

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Posts written before the editor existed are plain text with line breaks.
 * Wrap them in paragraphs so they render (and edit) like everything else.
 */
export function ensureHtml(body: string) {
  if (!body || HAS_MARKUP.test(body)) {
    return body
  }

  return body
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Same allow-list as the API's sanitize-html config — defence in depth for stored content. */
export function sanitizeRichHtml(html: string) {
  return DOMPurify.sanitize(expandAssetUrls(ensureHtml(html)), {
    ALLOWED_TAGS: ['h2', 'h3', 'p', 'br', 'strong', 'em', 'u', 's', 'span', 'a', 'ul', 'ol', 'li', 'blockquote', 'img', 'figure', 'figcaption', 'hr'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'style', 'data-align', 'data-size'],
    ALLOW_DATA_ATTR: false,
  })
}

/** Plain-text preview for cards and lists — first `max` characters of the body without markup. */
export function richTextExcerpt(html: string, max = 200) {
  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

/** First image in the body — used as the card thumbnail when there is no cover. */
export function firstImageSrc(html: string): string | null {
  const match = /<img\b[^>]*\bsrc="([^"]+)"/.exec(html)
  return match ? assetUrl(match[1]) : null
}
