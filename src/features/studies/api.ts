import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { StudyAbroad, StudyAbroadInput } from './types'

export const getStudies = () => apiGet<StudyAbroad[]>('/studies')
export const getAllStudies = () => apiGet<StudyAbroad[]>('/studies', { all: true })
export const createStudy = (payload: StudyAbroadInput) => apiPost<StudyAbroad>('/studies', payload)
export const updateStudy = (id: string, payload: Partial<StudyAbroadInput>) => apiPatch<StudyAbroad>(`/studies/${id}`, payload)
export const deleteStudy = (id: string) => apiDelete<{ success: boolean }>(`/studies/${id}`)
