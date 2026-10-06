import { ROLE_LABEL } from './roles'
import { ATTENDEE_ROLES, type Meeting } from './types'

export type DocumentMeeting = Pick<
  Meeting,
  'title' | 'heldOn' | 'method' | 'place' | 'drafter' | 'approver' | 'attendeeList' | 'attendees' | 'body' | 'decisions'
>

/** The institute's name as its form prints it. */
export const INSTITUTE = '오시1 세종학당'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** "2021. 09. 14. (화)" — the date as the form writes it. */
export function documentDate(iso: string) {
  const [year, month, day] = iso.split('-')
  const weekday = WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()]
  return `${year}. ${month}. ${day}. (${weekday})`
}

/** One row of 참석 현황: "- 임연식, 김부길", or nothing. */
export const attendanceLine = (names: string[]) => (names.length ? `- ${names.join(', ')}` : '')

/**
 * What the form says, cell by cell — read by the page (MeetingDocument) and
 * by the Word and Excel files, so the three never disagree.
 */
export function documentModel(meeting: DocumentMeeting) {
  const list = meeting.attendeeList ?? []
  const legacyNames = meeting.attendees
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  // Minutes from before 참석 현황 had rows keep their one line of names.
  const attendance =
    list.length > 0
      ? ATTENDEE_ROLES.map((role) => ({
          label: ROLE_LABEL[role],
          names: list.filter((attendee) => attendee.role === role).map((attendee) => attendee.name),
        }))
      : [{ label: '참 석 자', names: legacyNames }]

  return {
    year: `[${meeting.heldOn.slice(0, 4)}년]`,
    heading: `${INSTITUTE}  회의록`,
    drafter: meeting.drafter,
    approver: meeting.approver,
    title: meeting.title,
    method: meeting.method,
    date: documentDate(meeting.heldOn),
    place: meeting.place,
    attendance,
    total: list.length > 0 ? list.length : legacyNames.length,
    body: meeting.body,
    decisions: meeting.decisions,
  }
}

export type DocumentModel = ReturnType<typeof documentModel>
