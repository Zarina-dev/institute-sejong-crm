import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getAudit, type AuditFilters } from './api'

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditFilters) => [...auditKeys.all, filters] as const,
}

/** The previous page stays on screen while the next one loads — no flicker when paging or filtering. */
export function useAudit(filters: AuditFilters) {
  return useQuery({ queryKey: auditKeys.list(filters), queryFn: () => getAudit(filters), placeholderData: keepPreviousData })
}
