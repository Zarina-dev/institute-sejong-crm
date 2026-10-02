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
  /** Legacy subject; the page shows the date instead. */
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

/** What the list carries; the notes and decisions come with one meeting. */
export type MeetingSummary = Omit<Meeting, 'body' | 'decisions'>

export type MeetingInput = {
  /** Written by older entries only — minutes are named after their date. */
  title?: string
  heldOn: string
  attendees?: string
  body?: string
  decisions?: string
  attachments?: MeetingAttachment[]
}
