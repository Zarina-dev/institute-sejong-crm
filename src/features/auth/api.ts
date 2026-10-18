import { apiGet, apiPatch, apiPost } from '../../api/client'
import type { SessionUser } from '../../auth/session'

/** A token and the account it belongs to — the answer to a sign-in and to changing one's own password. */
export type AuthSessionResponse = { token: string; user: SessionUser }

/** A wrong username, a wrong password and a deactivated account are one 401, with one localized message. */
export function login(username: string, password: string) {
  return apiPost<AuthSessionResponse>('/auth/login', { username, password })
}

/** Ends the account's sessions on the server (every tab and device). */
export const logout = () => apiPost<void>('/auth/logout')

/** The signed-in account as it is now; 401 once the session has ended. */
export const getMe = () => apiGet<SessionUser & { exp: number }>('/auth/me')

/** One's own password: needs the current one; answers with a fresh token, since the old one stops working. */
export const changeOwnPassword = (id: string, currentPassword: string, password: string) =>
  apiPatch<AuthSessionResponse>(`/accounts/${id}/password`, { currentPassword, password })
