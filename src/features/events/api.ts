import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { ScheduleEvent, ScheduleEventInput } from './types'

export const getEvents = () => apiGet<ScheduleEvent[]>('/events')
export const getAllEvents = () => apiGet<ScheduleEvent[]>('/events', { all: true })
export const createEvent = (payload: ScheduleEventInput) => apiPost<ScheduleEvent>('/events', payload)
export const updateEvent = (id: string, payload: Partial<ScheduleEventInput>) => apiPatch<ScheduleEvent>(`/events/${id}`, payload)
export const deleteEvent = (id: string) => apiDelete<{ success: boolean }>(`/events/${id}`)
