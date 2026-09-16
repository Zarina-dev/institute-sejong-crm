import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { StaffInput, StaffMember } from './types'

/** Published members in display order — the About page. */
export const getPublishedStaff = () => apiGet<StaffMember[]>('/staff')

/** Everyone, hidden members included — admin. */
export const getAllStaff = () => apiGet<StaffMember[]>('/staff', { all: true })

export const createStaff = (payload: StaffInput) => apiPost<StaffMember>('/staff', payload)
export const updateStaff = (id: string, payload: Partial<StaffInput>) => apiPatch<StaffMember>(`/staff/${id}`, payload)
export const deleteStaff = (id: string) => apiDelete<{ success: boolean }>(`/staff/${id}`)
/** Full id list in the new display order → the server renumbers `sortOrder`. */
export const reorderStaff = (ids: string[]) => apiPatch<StaffMember[]>('/staff/order', { ids })
