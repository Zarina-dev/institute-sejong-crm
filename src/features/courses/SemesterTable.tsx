import { Card, Empty, Skeleton, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { formatDateRange } from '../../shared/format'
import { compareNatural } from './grouping'
import { sessionParts, weeklyHoursFromSessions } from './sessions'
import type { CourseRecord } from './types'

const { Title, Text } = Typography

type SemesterTableProps = {
  courses: CourseRecord[] | undefined
  loading: boolean
  emptyText: string
}

/** Courses sharing a start and end date are one semester. */
type Semester = { key: string; startDate: string | null; endDate: string | null; courses: CourseRecord[] }

function groupBySemester(courses: readonly CourseRecord[] | undefined): Semester[] {
  const map = new Map<string, Semester>()

  for (const course of courses ?? []) {
    const key = `${course.startDate ?? ''}~${course.endDate ?? ''}`
    const semester = map.get(key)

    if (semester) {
      semester.courses.push(course)
    } else {
      map.set(key, { key, startDate: course.startDate ?? null, endDate: course.endDate ?? null, courses: [course] })
    }
  }

  // Newest term first; inside a term, by programme then class name.
  return [...map.values()]
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
    .map((semester) => ({
      ...semester,
      courses: [...semester.courses].sort((a, b) => compareNatural(a.title, b.title) || compareNatural(a.subject, b.subject)),
    }))
}

const total = (courses: CourseRecord[], field: 'expectedStudents' | 'actualStudents') =>
  courses.reduce((sum, course) => sum + (course[field] ?? 0), 0)

/**
 * 학사 일정 — the semester overview the office keeps on paper: one row per
 * class with its teacher, planned and actual head count, meeting pattern and
 * hours. Numbers the admin has not filled in show as "—" rather than zero.
 */
export function SemesterTable({ courses, loading, emptyText }: SemesterTableProps) {
  const { t, language } = usePreferences()
  const semesters = useMemo(() => groupBySemester(courses), [courses])

  const columns = useMemo<NonNullable<TableProps<CourseRecord>['columns']>>(
    () => [
      {
        title: '#',
        key: 'index',
        width: 48,
        align: 'center',
        render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
      },
      {
        title: t('courses.form.subject'),
        key: 'subject',
        render: (_, course) => (
          <div className="cell-stack">
            <Text strong>{course.subject}</Text>
            <Text type="secondary">{course.title}</Text>
          </div>
        ),
      },
      {
        title: t('courses.form.teacher'),
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 130,
        render: (value: string | null) => value || <Text type="secondary">—</Text>,
      },
      {
        title: t('courses.form.expectedStudents'),
        dataIndex: 'expectedStudents',
        key: 'expectedStudents',
        width: 90,
        align: 'center',
        render: (value: number | null) => value ?? <Text type="secondary">—</Text>,
      },
      {
        title: t('courses.form.actualStudents'),
        dataIndex: 'actualStudents',
        key: 'actualStudents',
        width: 90,
        align: 'center',
        render: (value: number | null) => value ?? <Text type="secondary">—</Text>,
      },
      {
        title: t('courses.table.days'),
        key: 'days',
        width: 110,
        render: (_, course) => {
          const parts = sessionParts(course.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.days}</div>) : <Text type="secondary">—</Text>
        },
      },
      {
        title: t('courses.table.time'),
        key: 'time',
        width: 140,
        render: (_, course) => {
          const parts = sessionParts(course.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.time}</div>) : <Text type="secondary">—</Text>
        },
      },
      {
        title: t('courses.form.totalHours'),
        dataIndex: 'totalHours',
        key: 'totalHours',
        width: 110,
        align: 'center',
        render: (value: number | null) => value ?? <Text type="secondary">—</Text>,
      },
      {
        title: t('courses.form.weeklyHours'),
        key: 'weeklyHours',
        width: 90,
        align: 'center',
        render: (_, course) => course.weeklyHours ?? weeklyHoursFromSessions(course.sessions) ?? <Text type="secondary">—</Text>,
      },
    ],
    [language, t],
  )

  if (loading) {
    return (
      <Card className="surface-card">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (semesters.length === 0) {
    return (
      <Card className="surface-card empty-card">
        <Empty description={emptyText} />
      </Card>
    )
  }

  return (
    <div className="semester-tables">
      {semesters.map((semester) => (
        <section key={semester.key} aria-labelledby={`semester-${semester.key}`}>
          <div className="semester-heading">
            <Title level={3} id={`semester-${semester.key}`}>
              {formatDateRange(semester.startDate, semester.endDate, language) ?? t('courses.periodUnset')}
            </Title>
            <Text type="secondary">
              {t('courses.classCount', { count: semester.courses.length })} ·{' '}
              {t('courses.table.studentTotals', {
                expected: total(semester.courses, 'expectedStudents'),
                actual: total(semester.courses, 'actualStudents'),
              })}
            </Text>
          </div>

          <Card className="surface-card">
            <Table
              className="admin-table semester-table"
              columns={columns}
              dataSource={semester.courses}
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </section>
      ))}
    </div>
  )
}
