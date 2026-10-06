import type { StaffMember } from '../staff/types'
import type { AttendeeRole, MeetingAttendee } from './types'

/**
 * The row labels of 참석 현황 exactly as the institute's form prints them.
 * The document is a Korean record whatever language the panel is in, so
 * these are not translated.
 */
export const ROLE_LABEL: Record<AttendeeRole, string> = {
  director: '학 당 장',
  dispatched: '파견교원',
  local: '전담/현지교원',
  operations: '운영요원',
  other: '기타참석자',
}

/**
 * The 참석 현황 row a staff member goes in, read off their position. A
 * position can name several roles — "(현인) 학당장 | 현지교원" — and the
 * current director's title wins; a former one ("(전임) 학당장") attends as
 * the teacher they now are.
 */
export function roleFromPosition(position: string): AttendeeRole {
  const parts = position.split('|').map((part) => part.trim())
  const has = (word: string) => parts.some((part) => part.includes(word))

  if (parts.some((part) => part.includes('학당장') && !part.includes('전임'))) return 'director'
  if (has('파견')) return 'dispatched'
  if (has('전담') || has('현지') || has('교원') || has('강사')) return 'local'
  if (has('운영') || has('행정') || has('직원')) return 'operations'
  return 'other'
}

/** A staff member as an attendee, placed by their position. */
export const attendeeFromStaff = (member: StaffMember): MeetingAttendee => ({
  staffId: member.id,
  name: member.name,
  role: roleFromPosition(member.position),
  position: member.position,
})

/** Whether someone worked at the institute on the day of the meeting. */
export const employedOn = (member: Pick<StaffMember, 'startDate' | 'endDate'>, day: string) =>
  (!member.startDate || member.startDate <= day) && (!member.endDate || member.endDate >= day)
