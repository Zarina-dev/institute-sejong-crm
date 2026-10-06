import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { AcademicTerm, AcademicTermInput } from './types'

export const getTerms = () => apiGet<AcademicTerm[]>('/terms')
export const createTerm = (payload: AcademicTermInput) => apiPost<AcademicTerm>('/terms', payload)
export const updateTerm = (id: string, payload: Partial<AcademicTermInput>) => apiPatch<AcademicTerm>(`/terms/${id}`, payload)
/** Admin: classes and events filed under each semester, by code. */
export const getTermUsage = () => apiGet<Record<string, { courses: number; events: number }>>('/terms/usage')
export const deleteTerm = (id: string) => apiDelete<{ success: boolean }>(`/terms/${id}`)
