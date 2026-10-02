import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { Meeting, MeetingInput, MeetingSummary } from './types'

/** Every one of these needs the admin token — there is no public route. */
export const getMeetings = () => apiGet<MeetingSummary[]>('/meetings')
/** One meeting with its notes and decisions, which the list leaves out. */
export const getMeeting = (id: string) => apiGet<Meeting>(`/meetings/${id}`)
export const createMeeting = (payload: MeetingInput) => apiPost<Meeting>('/meetings', payload)
export const updateMeeting = (id: string, payload: Partial<MeetingInput>) => apiPatch<Meeting>(`/meetings/${id}`, payload)
export const deleteMeeting = (id: string) => apiDelete<{ success: boolean }>(`/meetings/${id}`)
