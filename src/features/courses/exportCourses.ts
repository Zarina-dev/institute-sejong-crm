import writeXlsxFile, { type Row, type SheetData } from 'write-excel-file/browser'

import type { TranslationKey } from '../../app/preferences'
import { groupCourses, type CourseGroup } from './grouping'
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

const COLUMN_WIDTHS = [22, 14, 10, 10, 14, 16, 12, 10, 14, 14, 12].map((width) => ({ width }))

/** Excel sheet names are limited to 31 characters and a few are illegal. */
const sheetName = (title: string) => title.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31) || 'Sheet'

/**
 * Two sheets may not share a name — Excel calls such a workbook corrupt and
 * opens it with sheets missing — and two programmes can collide once the
 * name is truncated, so the later one is numbered.
 */
function uniqueSheetName(title: string, used: Set<string>) {
  const base = sheetName(title)
  let name = base

  for (let index = 2; used.has(name.toLowerCase()); index += 1) {
    name = `${base.slice(0, 27)} (${index})`
  }

  used.add(name.toLowerCase())

  return name
}

/** Empty cells stay empty rather than printing 0. */
const numberCell = (value: number | null | undefined) => (value == null ? null : { value, type: Number as NumberConstructor })

/** One line per slot, so "월·수 / 화" and "09:00–10:30" line up in a cell. */
const joinParts = (parts: Array<{ days: string; time: string }>, key: 'days' | 'time') =>
  parts.map((part) => part[key]).join('\n')

const sumOf = (courses: CourseRecord[], field: 'expectedStudents' | 'actualStudents') =>
  courses.reduce((total, course) => total + (course[field] ?? 0), 0)

const courseRow = (course: CourseRecord, t: Translate, language: string): Row => {
  const parts = sessionParts(course.sessions, language)

  return [
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
  ]
}

const totalRow = (label: string, courses: CourseRecord[]): Row => [
  { value: label, fontWeight: 'bold' as const, align: 'right' as const },
  null,
  { value: sumOf(courses, 'expectedStudents'), type: Number as NumberConstructor, fontWeight: 'bold' as const },
  { value: sumOf(courses, 'actualStudents'), type: Number as NumberConstructor, fontWeight: 'bold' as const },
]

const headerRow = (t: Translate): Row =>
  HEADER_KEYS.map((key) => ({
    value: t(key),
    fontWeight: 'bold' as const,
    align: 'center' as const,
    backgroundColor: '#EEF1F7',
  }))

/**
 * The 수강 관리 table as a spreadsheet. The first sheet holds every
 * programme in one continuous table — each block under its own name and
 * closed by its 계, the last line a 총계 — so the whole report is readable
 * without hunting through tabs. The sheets that follow are one per
 * programme, for the office's per-programme head counts.
 */
export async function exportCoursesToExcel(courses: CourseRecord[], t: Translate, language: string, fileName: string) {
  const programmes = groupCourses(courses)

  if (programmes.length === 0) {
    return
  }

  const header = headerRow(t)
  const used = new Set<string>()

  const everything: SheetData = [header]

  for (const programme of programmes) {
    everything.push([{ value: programme.title, fontWeight: 'bold' as const, backgroundColor: '#F5F7FB' }])

    for (const course of programme.courses) {
      everything.push(courseRow(course, t, language))
    }

    everything.push(totalRow(t('courses.table.total'), programme.courses))
    everything.push([])
  }

  everything.push(totalRow(t('courses.table.grandTotal'), courses))

  const programmeSheet = (programme: CourseGroup) => ({
    data: [header, ...programme.courses.map((course) => courseRow(course, t, language)), totalRow(t('courses.table.total'), programme.courses)],
    columns: COLUMN_WIDTHS,
    sheet: uniqueSheetName(programme.title, used),
  })

  const sheets = [
    { data: everything, columns: COLUMN_WIDTHS, sheet: uniqueSheetName(t('courses.export.allSheet'), used) },
    ...programmes.map(programmeSheet),
  ]

  await writeXlsxFile(sheets).toFile(fileName)
}
