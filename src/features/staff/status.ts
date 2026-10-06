import type { StaffMember } from './types'

/**
 * 재직 중 · 입사 예정 · 퇴직 — read off the employment dates, never switched
 * by hand, so it turns over on someone's first and last day by itself. The
 * last day still counts as working. A member without dates (entered before
 * they existed) counts as working.
 */
export type StaffStatus = 'current' | 'upcoming' | 'former'

const today = () => new Date().toISOString().slice(0, 10)

export function staffStatus(member: Pick<StaffMember, 'startDate' | 'endDate'>, on = today()): StaffStatus {
  if (member.startDate && member.startDate > on) {
    return 'upcoming'
  }

  if (member.endDate && member.endDate < on) {
    return 'former'
  }

  return 'current'
}
