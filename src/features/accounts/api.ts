import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { StaffRole } from '../../auth/session'
import type { AccountsPage, StaffAccount, StaffAccountInput } from './types'

export type AccountsQuery = { q?: string; page: number; pageSize: number }

export const getAccounts = (query: AccountsQuery, signal?: AbortSignal) => apiGet<AccountsPage>('/accounts', query, { signal })
export const createAccount = (payload: StaffAccountInput) => apiPost<StaffAccount>('/accounts', payload)
export const updateAccount = (id: string, payload: { fullName?: string; role?: StaffRole }) => apiPatch<StaffAccount>(`/accounts/${id}`, payload)
/** An administrator setting someone else's password: no current password, and no token comes back. */
export const resetAccountPassword = (id: string, password: string) => apiPatch<{ user: StaffAccount }>(`/accounts/${id}/password`, { password })
export const setAccountStatus = (id: string, isActive: boolean) => apiPatch<StaffAccount>(`/accounts/${id}/status`, { isActive })
export const deleteAccount = (id: string) => apiDelete<{ success: boolean }>(`/accounts/${id}`)
