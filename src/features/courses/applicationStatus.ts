import type { ApplicationStatus } from './types'

/** One source of truth for status colour/label; was copy-pasted in three tables. */
export const applicationStatusMeta: Record<ApplicationStatus, { label: string; color: string }> = {
  pending: { label: '대기', color: 'gold' },
  approved: { label: '승인', color: 'green' },
  rejected: { label: '반려', color: 'red' },
  enrolled: { label: '수강 등록', color: 'blue' },
}
