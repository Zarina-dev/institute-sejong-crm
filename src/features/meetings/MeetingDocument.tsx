import { forwardRef } from 'react'

import { sanitizeRichHtml } from '../../shared/richText'
import './meetingDocument.css'
import { ROLE_LABEL } from './roles'
import { ATTENDEE_ROLES, type Meeting } from './types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** "2021. 09. 14. (화)" — the date as the form writes it. */
function documentDate(iso: string) {
  const [year, month, day] = iso.split('-')
  const weekday = WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()]
  return `${year}. ${month}. ${day}. (${weekday})`
}

type DocumentMeeting = Pick<
  Meeting,
  'title' | 'heldOn' | 'method' | 'place' | 'drafter' | 'approver' | 'attendeeList' | 'attendees' | 'body' | 'decisions'
>

/**
 * 회의록 laid out as the institute's own form — the 한글 template it has
 * always filled in: the title block with 기안 · 결재, then 회의명, 회의 방식,
 * 일자, 장소, 참석 현황 row by row with the total, and 회의 내용. Always in
 * Korean and always black on white, whatever the panel's language or theme:
 * it is the record that gets printed and filed.
 *
 * The same markup is printed and turned into the PDF (exportMeeting.ts), so
 * its stylesheet is self-contained.
 */
export const MeetingDocument = forwardRef<HTMLDivElement, { meeting: DocumentMeeting; institute: string }>(function MeetingDocument(
  { meeting, institute },
  ref,
) {
  const list = meeting.attendeeList ?? []
  const legacy = list.length === 0
  const legacyNames = meeting.attendees
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  const total = legacy ? legacyNames.length : list.length
  const attendanceRows = legacy ? 2 : ATTENDEE_ROLES.length + 1

  return (
    <div className="meeting-doc" ref={ref}>
      <table className="meeting-doc__table">
        <colgroup>
          <col style={{ width: '11%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '27%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '18%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={4} rowSpan={2} className="meeting-doc__title">
              <span>[{meeting.heldOn.slice(0, 4)}년]</span>
              <strong>{institute} &nbsp;회의록</strong>
            </td>
            <th className="meeting-doc__sign-head">기 &nbsp;안</th>
            <th className="meeting-doc__sign-head">결 &nbsp;재</th>
          </tr>
          <tr>
            <td className="meeting-doc__sign">{meeting.drafter}</td>
            <td className="meeting-doc__sign">{meeting.approver}</td>
          </tr>

          <tr>
            <th>회의명</th>
            <td colSpan={2}>{meeting.title}</td>
            <th>
              회 의<br />방 식
            </th>
            <td colSpan={2} className="meeting-doc__center">
              {meeting.method}
            </td>
          </tr>
          <tr>
            <th>일 &nbsp;자</th>
            <td colSpan={2} className="meeting-doc__center">
              {documentDate(meeting.heldOn)}
            </td>
            <th>장 &nbsp;소</th>
            <td colSpan={2} className="meeting-doc__center">
              {meeting.place}
            </td>
          </tr>

          <tr>
            <th rowSpan={attendanceRows}>
              참 &nbsp;석
              <br />현 &nbsp;황
            </th>
            {legacy ? (
              <>
                <th className="meeting-doc__role">참 석 자</th>
                <td colSpan={4}>{legacyNames.length ? `-. ${legacyNames.join(', ')}` : ''}</td>
              </>
            ) : (
              <AttendanceRow label={ROLE_LABEL[ATTENDEE_ROLES[0]]} names={namesIn(list, ATTENDEE_ROLES[0])} />
            )}
          </tr>
          {legacy
            ? null
            : ATTENDEE_ROLES.slice(1).map((role) => (
                <tr key={role}>
                  <AttendanceRow label={ROLE_LABEL[role]} names={namesIn(list, role)} />
                </tr>
              ))}
          <tr>
            <th className="meeting-doc__role">총 참석인원</th>
            <td colSpan={4} className="meeting-doc__total">
              총 &nbsp;&nbsp;&nbsp; {total} 명
            </td>
          </tr>

          <tr>
            <th>
              회 &nbsp;의
              <br />내 &nbsp;용
            </th>
            <td colSpan={5} className="meeting-doc__content">
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(meeting.body) }} />
            </td>
          </tr>

          {meeting.decisions ? (
            <tr>
              <th>
                결 &nbsp;정
                <br />사 &nbsp;항
              </th>
              <td colSpan={5} className="meeting-doc__content">
                <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(meeting.decisions) }} />
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
})

const namesIn = (list: DocumentMeeting['attendeeList'], role: (typeof ATTENDEE_ROLES)[number]) =>
  list.filter((attendee) => attendee.role === role).map((attendee) => attendee.name)

function AttendanceRow({ label, names }: { label: string; names: string[] }) {
  return (
    <>
      <th className="meeting-doc__role">{label}</th>
      <td colSpan={4}>{names.length ? `-. ${names.join(', ')}` : ''}</td>
    </>
  )
}
