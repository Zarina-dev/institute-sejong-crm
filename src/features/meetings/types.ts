/** A file handed out at the meeting (보통 .hwp), or the original minutes. */
export type MeetingAttachment = {
  url: string
  name: string
  size: number
  type: string
}

/** The rows of 참석 현황 on the institute's form, in its order. */
export const ATTENDEE_ROLES = ['director', 'dispatched', 'local', 'operations', 'other'] as const
export type AttendeeRole = (typeof ATTENDEE_ROLES)[number]

/** One person at the meeting — staff, or a guest typed by name. */
export type MeetingAttendee = {
  /** The 교직원 record they were picked from; null for a guest. */
  staffId: string | null
  name: string
  role: AttendeeRole
  /** Their position as it read on the day. */
  position: string
}

/** 회의록 — internal minutes; never served to the public site. */
export type Meeting = {
  id: string
  /** 회의명 */
  title: string
  heldOn: string
  /** 회의 방식 */
  method: string
  /** 장소 */
  place: string
  /** 기안 */
  drafter: string
  /** 결재 */
  approver: string
  /** 참석 현황, row by row; empty on minutes written before it existed. */
  attendeeList: MeetingAttendee[]
  /** 참석자 as one line — the only record of who came on older minutes. */
  attendees: string
  /** 회의 내용 — sanitized HTML. */
  body: string
  /** 결정 사항 — sanitized HTML. */
  decisions: string
  attachments: MeetingAttachment[]
  /** 원본 자료 — the minutes as already written elsewhere, shown in place. */
  original: MeetingAttachment | null
  createdAt: string
  updatedAt: string
}

/** What the list carries; the notes and decisions come with one meeting. */
export type MeetingSummary = Omit<Meeting, 'body' | 'decisions'>

export type MeetingInput = {
  title?: string
  heldOn: string
  method?: string
  place?: string
  drafter?: string
  approver?: string
  attendeeList?: MeetingAttendee[]
  body?: string
  decisions?: string
  attachments?: MeetingAttachment[]
  original?: MeetingAttachment | null
}
