import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { ScheduleEntry, ScheduleFilters, ScheduleInput } from './types'

export const getSchedule = (filters: ScheduleFilters) => apiGet<ScheduleEntry[]>('/schedule', filters)
export const createScheduleEntry = (payload: ScheduleInput) => apiPost<ScheduleEntry>('/schedule', payload)
export const updateScheduleEntry = (id: string, payload: Partial<ScheduleInput>) =>
  apiPatch<ScheduleEntry>(`/schedule/${id}`, payload)
export const deleteScheduleEntry = (id: string) => apiDelete<{ success: boolean }>(`/schedule/${id}`)
