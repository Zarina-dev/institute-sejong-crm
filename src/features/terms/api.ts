import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { AcademicTerm, AcademicTermInput } from './types'

export const getTerms = () => apiGet<AcademicTerm[]>('/terms')
export const createTerm = (payload: AcademicTermInput) => apiPost<AcademicTerm>('/terms', payload)
export const updateTerm = (id: string, payload: Partial<AcademicTermInput>) => apiPatch<AcademicTerm>(`/terms/${id}`, payload)
export const deleteTerm = (id: string) => apiDelete<{ success: boolean }>(`/terms/${id}`)
