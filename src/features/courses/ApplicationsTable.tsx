import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { Button, Space, Table } from 'antd'
import { memo, useMemo } from 'react'

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
 * The applications grid, shared by the 수강 신청 page and the expandable rows
 * of the 수강 관리 table. Columns are memoised on the callbacks so the table
 * does not rebuild its column model on every parent render.
 */
export const ApplicationsTable = memo(function ApplicationsTable({
  applications,
  loading,
  busyId,
  onApprove,
  onReject,
  showCourse = true,
  size = 'middle',
  emptyText = '신청 내역이 없습니다.',
}: ApplicationsTableProps) {
  const columns = useMemo<NonNullable<TableProps<CourseApplicationRecord>['columns']>>(() => {
    const base: NonNullable<TableProps<CourseApplicationRecord>['columns']> = [
      { title: '신청자', dataIndex: 'applicantName', key: 'applicantName' },
      {
        title: '학생 ID',
        key: 'studentId',
        render: (_, record) => record.student?.studentId ?? '-',
      },
      { title: '이메일', dataIndex: 'applicantEmail', key: 'applicantEmail' },
      { title: '연락처', dataIndex: 'phone', key: 'phone', render: (value?: string | null) => value || '-' },
    ]

    if (showCourse) {
      base.push({ title: '희망 과정', key: 'course', render: (_, record) => record.course?.title ?? '-' })
      base.push({ title: '목적', dataIndex: 'goal', key: 'goal', render: (value?: string | null) => value || '-' })
    }

    base.push(
      {
        title: '상태',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (_, record) => <ApplicationStatusTag status={record.status} />,
      },
      {
        title: '관리',
        key: 'actions',
        width: 170,
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
              >
                승인
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                disabled={busy || record.status === 'rejected'}
                onClick={() => onReject(record)}
              >
                반려
              </Button>
            </Space>
          )
        },
      },
    )

    return base
  }, [busyId, onApprove, onReject, showCourse])

  return (
    <Table
      className="admin-table"
      size={size}
      columns={columns}
      dataSource={applications}
      rowKey="id"
      loading={loading}
      pagination={applications.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
      scroll={{ x: showCourse ? 1100 : 800 }}
      locale={{ emptyText }}
    />
  )
})
