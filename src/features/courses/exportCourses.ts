import writeXlsxFile, { type Row, type SheetData } from 'write-excel-file/browser'

import type { TranslationKey } from '../../app/preferences'
import { groupCourses } from './grouping'
import { sessionParts, weeklyHoursFromSessions } from './sessions'
import type { CourseRecord } from './types'

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string

const HEADER_KEYS: TranslationKey[] = [
  'courses.form.subject',
  'courses.form.teacher',
  'courses.form.expectedStudents',
  'courses.form.actualStudents',
  'courses.table.days',
  'courses.table.time',
  'courses.form.totalHours',
  'courses.form.weeklyHours',
  'courses.form.startDate',
  'courses.form.endDate',
  'courses.columns.visibility',
]

const COLUMN_WIDTHS = [18, 14, 10, 10, 14, 16, 12, 10, 14, 14, 12].map((width) => ({ width }))

/** Excel sheet names are limited to 31 characters and a few are illegal. */
const sheetName = (title: string) => title.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31) || 'Sheet'

/** Empty cells stay empty rather than printing 0. */
const numberCell = (value: number | null | undefined) => (value == null ? null : { value, type: Number as NumberConstructor })

/** One line per slot, so "월·수 / 화" and "09:00–10:30" line up in a cell. */
const joinParts = (parts: Array<{ days: string; time: string }>, key: 'days' | 'time') =>
  parts.map((part) => part[key]).join('\n')

/**
 * The 수강 관리 table as a spreadsheet — one sheet per programme (한국어,
 * 영어 …), each closed by its 계 row, so head counts can be read per
 * programme the way the office needs them.
 */
export async function exportCoursesToExcel(courses: CourseRecord[], t: Translate, language: string, fileName: string) {
  const header: Row = HEADER_KEYS.map((key) => ({
    value: t(key),
    fontWeight: 'bold' as const,
    align: 'center' as const,
    backgroundColor: '#EEF1F7',
  }))

  const programmes = groupCourses(courses)

  if (programmes.length === 0) {
    return
  }

  const sheets = programmes.map((programme) => {
    const data: SheetData = [header]

    for (const course of programme.courses) {
      const parts = sessionParts(course.sessions, language)

      data.push([
        { value: course.subject },
        { value: course.teacherName ?? '' },
        numberCell(course.expectedStudents),
        numberCell(course.actualStudents),
        { value: joinParts(parts, 'days'), wrap: true },
        { value: joinParts(parts, 'time'), wrap: true },
        numberCell(course.totalHours),
        numberCell(course.weeklyHours ?? weeklyHoursFromSessions(course.sessions)),
        { value: course.startDate ?? '' },
        { value: course.endDate ?? '' },
        { value: course.isPublished ? t('common.published') : t('common.unpublished') },
      ])
    }

    const sum = (field: 'expectedStudents' | 'actualStudents') =>
      programme.courses.reduce((total, course) => total + (course[field] ?? 0), 0)

    data.push([
      { value: t('courses.table.total'), fontWeight: 'bold' as const, align: 'right' as const },
      null,
      { value: sum('expectedStudents'), type: Number as NumberConstructor, fontWeight: 'bold' as const },
      { value: sum('actualStudents'), type: Number as NumberConstructor, fontWeight: 'bold' as const },
    ])

    return { data, columns: COLUMN_WIDTHS, sheet: sheetName(programme.title) }
  })

  await writeXlsxFile(sheets).toFile(fileName)
}