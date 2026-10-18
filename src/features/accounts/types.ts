import type { StaffRole } from '../../auth/session'

/** A sign-in account (API `/accounts`). The password never comes back from the API. */
export type StaffAccount = {
  id: string
  username: string
  fullName: string
  role: StaffRole
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type StaffAccountInput = {
  username: string
  password: string
  fullName?: string
  role?: StaffRole
}

export type AccountsPage = { items: StaffAccount[]; total: number; page: number; pageSize: number }

/** Same rules as the API's: 3–64 Latin letters, digits, dot, dash, underscore; 10–128 characters of password. */
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/
export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 128
