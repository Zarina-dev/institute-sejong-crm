import { Card, Empty, Skeleton, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { groupCourses } from './grouping'
import { sessionParts, weeklyHoursFromSessions } from './sessions'
import type { CourseRecord } from './types'

const { Text } = Typography

type SemesterTableProps = {
  courses: CourseRecord[] | undefined
  loading: boolean
  emptyText: string
}

const dash = <Text type="secondary">—</Text>

/**
 * The semester overview the office keeps on paper: one row per class, laid
 * out like the admin 수강 관리 table — programme, class, teacher, planned and
 * actual head count, meeting pattern and hours, with totals underneath.
 * Rows are grouped by programme (Korean first), not by date, so a new class
 * simply joins its block.
 */
export function SemesterTable({ courses, loading, emptyText }: SemesterTableProps) {
  const { t, language } = usePreferences()

  // Classes in programme order; only the first row of a programme prints its
  // name, exactly as the admin table does.
  const { rows, rowSpans } = useMemo(() => {
    const list: CourseRecord[] = []
    const spans = new Map<string, number>()

    for (const group of groupCourses(courses)) {
      group.courses.forEach((course, index) => {
        list.push(course)
        spans.set(course.id, index === 0 ? group.courses.length : 0)
      })
    }

    return { rows: list, rowSpans: spans }
  }, [courses])

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, course) => ({
          expected: sum.expected + (course.expectedStudents ?? 0),
          actual: sum.actual + (course.actualStudents ?? 0),
        }),
        { expected: 0, actual: 0 },
      ),
    [rows],
  )

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
        title: t('courses.form.title'),
        key: 'title',
        width: 140,
        onCell: (course) => ({
          className: rowSpans.get(course.id) ? 'course-programme-cell' : 'course-programme-cell course-programme-cell--continued',
        }),
        render: (_, course) => (rowSpans.get(course.id) ? <Text strong>{course.title}</Text> : null),
      },
      {
        title: t('courses.form.subject'),
        dataIndex: 'subject',
        key: 'subject',
        render: (value: string) => <Text strong>{value}</Text>,
      },
      {
        title: t('courses.form.teacher'),
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: 130,
        render: (value: string | null) => value || dash,
      },
      {
        title: t('courses.form.expectedStudents'),
        dataIndex: 'expectedStudents',
        key: 'expectedStudents',
        width: 90,
        align: 'center',
        render: (value: number | null) => value ?? dash,
      },
      {
        title: t('courses.form.actualStudents'),
        dataIndex: 'actualStudents',
        key: 'actualStudents',
        width: 90,
        align: 'center',
        render: (value: number | null) => value ?? dash,
      },
      {
        title: t('courses.table.days'),
        key: 'days',
        width: 110,
        render: (_, course) => {
          const parts = sessionParts(course.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.days}</div>) : dash
        },
      },
      {
        title: t('courses.table.time'),
        key: 'time',
        width: 140,
        render: (_, course) => {
          const parts = sessionParts(course.sessions, language)
          return parts.length ? parts.map((part) => <div key={part.days + part.time}>{part.time}</div>) : dash
        },
      },
      {
        title: t('courses.form.totalHours'),
        dataIndex: 'totalHours',
        key: 'totalHours',
        width: 110,
        align: 'center',
        render: (value: number | null) => value ?? dash,
      },
      {
        title: t('courses.form.weeklyHours'),
        key: 'weeklyHours',
        width: 90,
        align: 'center',
        render: (_, course) => course.weeklyHours ?? weeklyHoursFromSessions(course.sessions) ?? dash,
      },
    ],
    [language, rowSpans, t],
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
        rowKey="id"
        size="middle"
        pagination={false}
        scroll={{ x: 'max-content' }}
        /* The paper table ends with a 계 row; so does this one. */
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row className="semester-table__total">
              <Table.Summary.Cell index={0} colSpan={4} align="right">
                <Text strong>{t('courses.table.total')}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="center">
                <Text strong>{totals.expected}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="center">
                <Text strong>{totals.actual}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={4} />
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </Card>
  )
}
