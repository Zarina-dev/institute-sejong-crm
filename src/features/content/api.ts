import { apiGet, apiRequest } from '../../api/client'

/** Blocks of site copy the admin edits; see backend `CONTENT_SLUGS`. */
export const CONTENT_SLUGS = [
  'about.greeting',
  'notices.faq',
  'resources.textbooks',
  'resources.links',
  'history.intro',
] as const

export type ContentSlug = (typeof CONTENT_SLUGS)[number]

export type ContentBlock = {
  title: string
  /** Sanitized HTML. */
  body: string
  /** Language the text actually came from — may differ from the request when it fell back. */
  locale: string
}

export type ContentRow = { id: string; slug: ContentSlug; locale: string; title: string; body: string; updatedAt: string }

/** Every block for one language, keyed by slug (missing ones fall back server-side). */
export const getContent = (locale: string) => apiGet<Partial<Record<ContentSlug, ContentBlock>>>('/content', { locale })

/** Raw rows for the admin editor. */
export const getAllContent = () => apiGet<ContentRow[]>('/content', { all: true })

export const saveContent = (slug: ContentSlug, locale: string, payload: { title?: string; body?: string }) =>
  apiRequest<ContentRow>(`/content/${slug}/${locale}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })