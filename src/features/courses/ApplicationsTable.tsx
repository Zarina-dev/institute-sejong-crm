import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { Button, Space, Table } from 'antd'
import { memo, useMemo } from 'react'

import { usePreferences } from '../../app/preferences'
import { useTableLayout } from '../../shared/useTableLayout'
import { ApplicationStatusTag } from './ApplicationStatusTag'
import type { CourseApplicationRecord } from './types'

type ApplicationsTableProps = {
  applications: CourseApplicationRecord[]
  loading?: boolean
  /** id of the application whose status change is in flight, if any. */
  busyId?: string | null
  onApprove: (application: CourseApplicationRecord) => void
  onReject: (application: CourseApplicationRecord) => void
  /** Show the course column — off when the table is already nested under a course. */
  showCourse?: boolean
  size?: 'small' | 'middle'
  emptyText?: string
}

/**
 * The applications grid, shared by the applications page and the expandable
 * rows of the course table. Columns are memoised on the callbacks so the
 * table does not rebuild its column model on every parent render.
 */
export const ApplicationsTable = memo(function ApplicationsTable({
  applications,
  loading,
  busyId,
  onApprove,
  onReject,
  showCourse = true,
  size = 'middle',
  emptyText,
}: ApplicationsTableProps) {
  const { t } = usePreferences()
  const { pinActions, compactActions } = useTableLayout()

  const columns = useMemo<NonNullable<TableProps<CourseApplicationRecord>['columns']>>(() => {
    const base: NonNullable<TableProps<CourseApplicationRecord>['columns']> = [
      { title: t('courses.applicant'), dataIndex: 'applicantName', key: 'applicantName' },
      { title: t('courses.studentId'), key: 'studentId', render: (_, record) => record.student?.studentId ?? '-' },
      { title: t('courses.email'), dataIndex: 'applicantEmail', key: 'applicantEmail', responsive: ['lg'] },
      { title: t('courses.phone'), dataIndex: 'phone', key: 'phone', responsive: ['lg'], render: (value?: string | null) => value || '-' },
    ]

    if (showCourse) {
      base.push({ title: t('courses.desiredCourse'), key: 'course', render: (_, record) => record.course?.title ?? '-' })
      base.push({ title: t('courses.purpose'), dataIndex: 'goal', key: 'goal', responsive: ['xl'], render: (value?: string | null) => value || '-' })
    }

    base.push(
      {
        title: t('common.status'),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (_, record) => <ApplicationStatusTag status={record.status} />,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 90 : 190,
        render: (_, record) => {
          const busy = busyId === record.id

          return (
            <Space size="small">
              <Button
                size="small"
                icon={<CheckOutlined />}
                loading={busy}
                disabled={record.status === 'approved' || record.status === 'enrolled'}
                onClick={() => onApprove(record)}
                aria-label={t('common.approve')}
              >
                {compactActions ? null : t('common.approve')}
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                disabled={busy || record.status === 'rejected'}
                onClick={() => onReject(record)}
                aria-label={t('common.reject')}
              >
                {compactActions ? null : t('common.reject')}
              </Button>
            </Space>
          )
        },
      },
    )

    return base
  }, [busyId, compactActions, onApprove, onReject, pinActions, showCourse, t])

  return (
    <Table
      className="admin-table"
      size={size}
      columns={columns}
      dataSource={applications}
      rowKey="id"
      loading={loading}
      pagination={applications.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
      scroll={{ x: 'max-content' }}
      locale={{ emptyText: emptyText ?? t('courses.appsEmpty') }}
    />
  )
})
