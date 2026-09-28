/** A file handed out at the meeting (보통 .hwp). */
export type MeetingAttachment = {
  url: string
  name: string
  size: number
  type: string
}

/** 회의록 — internal minutes; never served to the public site. */
export type Meeting = {
  id: string
  /** 안건 / 회의명 */
  title: string
  heldOn: string
  /** 참석자 */
  attendees: string
  /** 회의 내용 — sanitized HTML. */
  body: string
  /** 결정 사항 — sanitized HTML. */
  decisions: string
  attachments: MeetingAttachment[]
  createdAt: string
  updatedAt: string
}

export type MeetingInput = {
  title: string
  heldOn: string
  attendees?: string
  body?: string
  decisions?: string
  attachments?: MeetingAttachment[]
}
