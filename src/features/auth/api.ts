import { apiPost } from '../../api/client'
import type { StudentApiRecord } from '../students/api'

export type PublicStudent = Omit<StudentApiRecord, 'password' | 'notes'>

export type LoginResponse =
  | { role: 'admin'; token: string; student: null }
  | { role: 'student'; token: string; student: PublicStudent }

/** One endpoint for both roles; a wrong password is a 401 with a localized message. */
export function login(username: string, password: string) {
  return apiPost<LoginResponse>('/auth/login', { username, password })
}