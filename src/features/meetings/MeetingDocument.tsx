import { forwardRef } from 'react'

import { sanitizeRichHtml } from '../../shared/richText'
import { attendanceLine, documentModel, type DocumentMeeting } from './documentModel'
import './meetingDocument.css'

/**
 * 회의록 laid out as the institute's own form — the 한글 template it has
 * always filled in: the title block with 기안 · 결재, then 회의명, 회의 방식,
 * 일자, 장소, 참석 현황 row by row with the total, and 회의 내용. Always in
 * Korean and always black on white, whatever the panel's language or theme:
 * it is the record that gets printed and filed.
 *
 * The cells come from documentModel, which the Word and Excel files read
 * too; the markup itself is what is printed and turned into the PDF
 * (exportMeeting.ts), so its stylesheet is self-contained.
 */
export const MeetingDocument = forwardRef<HTMLDivElement, { meeting: DocumentMeeting }>(function MeetingDocument({ meeting }, ref) {
  const model = documentModel(meeting)
  const [first, ...rest] = model.attendance

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
              <span>{model.year}</span>
              <strong>{model.heading}</strong>
            </td>
            <th className="meeting-doc__sign-head">기 &nbsp;안</th>
            <th className="meeting-doc__sign-head">결 &nbsp;재</th>
          </tr>
          <tr>
            <td className="meeting-doc__sign">{model.drafter}</td>
            <td className="meeting-doc__sign">{model.approver}</td>
          </tr>

          <tr>
            <th>회의명</th>
            <td colSpan={2}>{model.title}</td>
            <th>
              회 의<br />방 식
            </th>
            <td colSpan={2} className="meeting-doc__center">
              {model.method}
            </td>
          </tr>
          <tr>
            <th>일 &nbsp;자</th>
            <td colSpan={2} className="meeting-doc__center">
              {model.date}
            </td>
            <th>장 &nbsp;소</th>
            <td colSpan={2} className="meeting-doc__center">
              {model.place}
            </td>
          </tr>

          <tr>
            <th rowSpan={model.attendance.length + 1}>
              참 &nbsp;석
              <br />현 &nbsp;황
            </th>
            <th className="meeting-doc__role">{first.label}</th>
            <td colSpan={4}>{attendanceLine(first.names)}</td>
          </tr>
          {rest.map((row) => (
            <tr key={row.label}>
              <th className="meeting-doc__role">{row.label}</th>
              <td colSpan={4}>{attendanceLine(row.names)}</td>
            </tr>
          ))}
          <tr>
            <th className="meeting-doc__role">총 참석인원</th>
            <td colSpan={4} className="meeting-doc__total">
              총 &nbsp;&nbsp;&nbsp; {model.total} 명
            </td>
          </tr>

          <tr>
            <th>
              회 &nbsp;의
              <br />내 &nbsp;용
            </th>
            <td colSpan={5} className="meeting-doc__content meeting-doc__content--body">
              <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(model.body) }} />
            </td>
          </tr>

          {model.decisions ? (
            <tr>
              <th>
                결 &nbsp;정
                <br />사 &nbsp;항
              </th>
              <td colSpan={5} className="meeting-doc__content">
                <div dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(model.decisions) }} />
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
})
