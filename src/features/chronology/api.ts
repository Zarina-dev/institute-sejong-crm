import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { ChronologyEntry, ChronologyEntryInput } from './types'

export const getChronology = () => apiGet<ChronologyEntry[]>('/chronology')
export const getAllChronology = () => apiGet<ChronologyEntry[]>('/chronology', { all: true })
export const createChronologyEntry = (payload: ChronologyEntryInput) => apiPost<ChronologyEntry>('/chronology', payload)
export const updateChronologyEntry = (id: string, payload: Partial<ChronologyEntryInput>) =>
  apiPatch<ChronologyEntry>(`/chronology/${id}`, payload)
export const deleteChronologyEntry = (id: string) => apiDelete<{ success: boolean }>(`/chronology/${id}`)
