import { Card, Empty, Skeleton, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { groupCourses } from './grouping'
import { sessionParts } from './sessions'
import type { CourseRecord } from './types'

const { Text } = Typography

type SemesterTableProps = {
  courses: CourseRecord[] | undefined
  loading: boolean
  emptyText: string
}

/** A programme heading inside the table, or one class. */
type Row = { kind: 'programme'; key: string; title: string; classes: number } | { kind: 'course'; key: string; course: CourseRecord }

const dash = <Text type="secondary">—</Text>

/**
 * 학사 일정 — every class of the chosen semester in **one** table, with the
 * programme (한국어, TOPIK …) as a heading row rather than a table of its
 * own, so the whole semester reads as a single sheet. Columns are the ones
 * the institute's paper form carries: 세부 과정, 담당 강사, 예상수, 실제수 and
 * the weekly pattern.
 */
export function SemesterTable({ courses, loading, emptyText }: SemesterTableProps) {
  const { t, language } = usePreferences()

  const rows = useMemo<Row[]>(
    () =>
      groupCourses(courses).flatMap((programme) => [
        { kind: 'programme' as const, key: `group-${programme.title}`, title: programme.title, classes: programme.courses.length },
        ...programme.courses.map((course) => ({ kind: 'course' as const, key: course.id, course })),
      ]),
    [courses],
  )

  /** A heading row spans the table; the other cells collapse to nothing. */
  const spanning = (row: Row, index: number) => (row.kind === 'programme' ? { colSpan: index === 0 ? 7 : 0 } : {})

  const columns = useMemo<NonNullable<TableProps<Row>['columns']>>(
    () => [
      {
        title: '#',
        key: 'index',
        width: 52,
        align: 'center',
        onCell: (row) => spanning(row, 0),
        render: (_, row, index) =>
          row.kind === 'programme' ? (
            <div className="semester-group">
              <strong>{row.title}</strong>
              <Text type="secondary">{t('courses.classCount', { count: row.classes })}</Text>
            </div>
          ) : (
            // Count classes, not rows: the headings must not take a number.
            <Text type="secondary">{rows.slice(0, index + 1).filter((item) => item.kind === 'course').length}</Text>
          ),
      },
      {
        title: t('courses.form.subject'),
        key: 'subject',
        onCell: (row) => spanning(row, 1),
        render: (_, row) => (row.kind === 'course' ? <Text strong>{row.course.subject}</Text> : null),
      },
      {
        title: t('courses.form.teacher'),
        key: 'teacherName',
        width: 130,
        onCell: (row) => spanning(row, 2),
        render: (_, row) => (row.kind === 'course' ? row.course.teacherName || dash : null),
      },
      {
        title: t('courses.form.expectedStudents'),
        key: 'expectedStudents',
        width: 90,
        align: 'center',
        onCell: (row) => spanning(row, 3),
        render: (_, row) => (row.kind === 'course' ? row.course.expectedStudents ?? dash : null),
      },
      {
        title: t('courses.form.actualStudents'),
        key: 'actualStudents',
        width: 90,
        align: 'center',
        onCell: (row) => spanning(row, 4),
        render: (_, row) => (row.kind === 'course' ? row.course.actualStudents ?? dash : null),
      },
      {
        title: t('courses.table.days'),
        key: 'days',
        width: 110,
        onCell: (row) => spanning(row, 5),
        render: (_, row) => {
          if (row.kind !== 'course') {
            return null
          }

          const parts = sessionParts(row.course.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.days}</div>) : dash
        },
      },
      {
        title: t('courses.table.time'),
        key: 'time',
        width: 140,
        onCell: (row) => spanning(row, 6),
        render: (_, row) => {
          if (row.kind !== 'course') {
            return null
          }

          const parts = sessionParts(row.course.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.time}</div>) : dash
        },
      },
    ],
    [language, rows, t],
  )

  if (loading) {
    return (
      <Card className="surface-card">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (rows.length === 0) {
    return (
      <Card className="surface-card empty-card">
        <Empty description={emptyText} />
      </Card>
    )
  }

  return (
    <Card className="surface-card">
      <Table
        className="admin-table semester-table"
        columns={columns}
        dataSource={rows}
        rowKey="key"
        size="middle"
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={(row) => (row.kind === 'programme' ? 'semester-table__group' : '')}
      />
    </Card>
  )
}
