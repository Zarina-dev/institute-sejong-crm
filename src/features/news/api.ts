import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { NewsInput, NewsPost } from './types'

/** Published posts only; `limit` for previews (home page). */
export const getPublishedNews = (limit?: number) => apiGet<NewsPost[]>('/news', { limit })

/** Everything including drafts — admin. */
export const getAllNews = () => apiGet<NewsPost[]>('/news', { all: true })

export const getNewsPost = (id: string) => apiGet<NewsPost>(`/news/${id}`)

export const createNews = (payload: NewsInput) => apiPost<NewsPost>('/news', payload)
export const updateNews = (id: string, payload: Partial<NewsInput>) => apiPatch<NewsPost>(`/news/${id}`, payload)
export const deleteNews = (id: string) => apiDelete<{ success: boolean }>(`/news/${id}`)
export const setNewsPublished = (id: string, published: boolean) =>
  apiPost<NewsPost>(`/news/${id}/${published ? 'publish' : 'unpublish'}`)
