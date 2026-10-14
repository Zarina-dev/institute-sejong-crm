import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { Graduate, GraduateInput } from './types'

export const getGraduates = () => apiGet<Graduate[]>('/graduates')
export const getAllGraduates = () => apiGet<Graduate[]>('/graduates', { all: true })
export const createGraduate = (payload: GraduateInput) => apiPost<Graduate>('/graduates', payload)
export const updateGraduate = (id: string, payload: Partial<GraduateInput>) => apiPatch<Graduate>(`/graduates/${id}`, payload)
export const deleteGraduate = (id: string) => apiDelete<{ success: boolean }>(`/graduates/${id}`)
