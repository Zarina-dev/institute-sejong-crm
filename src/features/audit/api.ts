import { apiGet } from '../../api/client'

/** What an entry records — the server's AUDIT_ACTIONS. */
export const AUDIT_ACTIONS = ['create', 'update', 'publish', 'unpublish', 'reorder', 'delete', 'restore', 'purge', 'login', 'login_failed'] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/** The record types an entry can be about: the trash types plus what is edited but never deleted. */
export const AUDIT_TYPES = [
  'courses',
  'terms',
  'news',
  'events',
  'competitions',
  'studies',
  'staff',
  'chronology',
  'textbooks',
  'materials',
  'meetings',
  'content',
  'gallery',
] as const
export type AuditType = (typeof AUDIT_TYPES)[number]

export type AuditEntry = {
  id: string
  at: string
  /** Who did it: the admin's username, or `system` for the 30-day purge. */
  actor: string
  action: AuditAction
  entityType: string | null
  entityId: string | null
  /** The record's name when it happened — it may since have been renamed or removed. */
  label: string
  /** Fields an update sent. */
  changes: string[]
  ip: string | null
}

export type AuditFilters = { page: number; action?: AuditAction; type?: AuditType; q?: string }

export type AuditPage = { items: AuditEntry[]; total: number; page: number; limit: number }

export const AUDIT_PAGE_SIZE = 50

export const getAudit = (filters: AuditFilters) => apiGet<AuditPage>('/audit', { ...filters, limit: AUDIT_PAGE_SIZE })
