import { Card, Empty, Skeleton, Table, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { groupCourses } from './grouping'
import { sessionParts, weeklyHoursFromSessions } from './sessions'
import type { CourseRecord } from './types'

const { Title, Text } = Typography

type SemesterTableProps = {
  courses: CourseRecord[] | undefined
  loading: boolean
  emptyText: string
}

const dash = <Text type="secondary">—</Text>

const sumOf = (courses: CourseRecord[], field: 'expectedStudents' | 'actualStudents') =>
  courses.reduce((sum, course) => sum + (course[field] ?? 0), 0)

/**
 * The semester overview the office keeps on paper — one table per programme
 * (한국어, TOPIK, 기타 …), each closed by its own 계 row: class, teacher,
 * planned and actual head count, meeting pattern and hours. A new class
 * simply joins its programme's table.
 */
export function SemesterTable({ courses, loading, emptyText }: SemesterTableProps) {
  const { t, language } = usePreferences()
  const programmes = useMemo(() => groupCourses(courses), [courses])

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
    [language, t],
  )

  if (loading) {
    return (
      <Card className="surface-card">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    )
  }

  if (programmes.length === 0) {
    return (
      <Card className="surface-card empty-card">
        <Empty description={emptyText} />
      </Card>
    )
  }

  return (
    <div className="semester-tables">
      {programmes.map((programme) => (
        <section key={programme.title} aria-labelledby={`semester-${programme.title}`}>
          <div className="semester-heading">
            <Title level={3} id={`semester-${programme.title}`}>
              {programme.title}
            </Title>
            <Text type="secondary">{t('courses.classCount', { count: programme.courses.length })}</Text>
          </div>

          <Card className="surface-card">
            <Table
              className="admin-table semester-table"
              columns={columns}
              dataSource={programme.courses}
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 'max-content' }}
              /* The paper table ends each programme with a 계 row; so does this one. */
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row className="semester-table__total">
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <Text strong>{t('courses.table.total')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <Text strong>{sumOf(programme.courses, 'expectedStudents')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="center">
                      <Text strong>{sumOf(programme.courses, 'actualStudents')}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} colSpan={4} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </section>
      ))}
    </div>
  )
}
