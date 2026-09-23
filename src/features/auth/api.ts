import { apiPost } from '../../api/client'

export type LoginResponse = { role: 'admin'; token: string }

/** The administrator is the only account; a wrong password is a 401 with a localized message. */
export function login(username: string, password: string) {
  return apiPost<LoginResponse>('/auth/login', { username, password })
}
