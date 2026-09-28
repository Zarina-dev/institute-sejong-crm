import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { Competition, CompetitionInput, CompetitionKind } from './types'

export const getCompetitions = (kind: CompetitionKind) => apiGet<Competition[]>('/competitions', { kind })
export const getAllCompetitions = () => apiGet<Competition[]>('/competitions', { all: true })
export const createCompetition = (payload: CompetitionInput) => apiPost<Competition>('/competitions', payload)
export const updateCompetition = (id: string, payload: Partial<CompetitionInput>) => apiPatch<Competition>(`/competitions/${id}`, payload)
export const deleteCompetition = (id: string) => apiDelete<{ success: boolean }>(`/competitions/${id}`)
