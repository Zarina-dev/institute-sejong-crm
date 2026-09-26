import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { Textbook, TextbookInput } from './types'

export const getPublishedTextbooks = () => apiGet<Textbook[]>('/textbooks')
export const getAllTextbooks = () => apiGet<Textbook[]>('/textbooks', { all: true })
export const createTextbook = (payload: TextbookInput) => apiPost<Textbook>('/textbooks', payload)
export const updateTextbook = (id: string, payload: Partial<TextbookInput>) => apiPatch<Textbook>(`/textbooks/${id}`, payload)
export const deleteTextbook = (id: string) => apiDelete<{ success: boolean }>(`/textbooks/${id}`)

/** Full id list in the new display order → the server renumbers `sortOrder`. */
export const reorderTextbooks = (ids: string[]) => apiPatch<Textbook[]>('/textbooks/order', { ids })
