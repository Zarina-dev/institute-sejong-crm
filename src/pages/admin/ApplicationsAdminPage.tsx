import { App, Card, Segmented, Space, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { ApplicationsTable } from '../../features/courses/ApplicationsTable'
import { applicationStatusMeta } from '../../features/courses/applicationStatus'
import { useApplications, useSetApplicationStatus } from '../../features/courses/queries'
import type { ApplicationStatus, CourseApplicationRecord } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

type StatusFilter = ApplicationStatus | 'all'

export function ApplicationsAdminPage() {
  const { message } = App.useApp()
  const applications = useApplications()
  const setStatus = useSetApplicationStatus()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: 0, pending: 0, approved: 0, rejected: 0, enrolled: 0 }

    for (const application of applications.data ?? []) {
      result.all += 1
      result[application.status ?? 'pending'] += 1
    }

    return result
  }, [applications.data])

  const visible = useMemo(() => {
    const list = applications.data ?? []
    return statusFilter === 'all' ? list : list.filter((item) => (item.status ?? 'pending') === statusFilter)
  }, [applications.data, statusFilter])

  const change = useCallback(
    (application: CourseApplicationRecord, status: 'approved' | 'rejected') => {
      setStatus.mutate(
        { id: application.id, status },
        {
          onSuccess: () => message.success(`${application.applicantName} — ${applicationStatusMeta[status].label} 처리되었습니다.`),
          onError: (err) => message.error(getErrorMessage(err, '상태 변경에 실패했습니다.')),
        },
      )
    },
    [message, setStatus],
  )

  const handleApprove = useCallback((application: CourseApplicationRecord) => change(application, 'approved'), [change])
  const handleReject = useCallback((application: CourseApplicationRecord) => change(application, 'rejected'), [change])

  const filterOptions = useMemo(
    (): Array<{ value: StatusFilter; label: string }> => [
      { value: 'all', label: `전체 ${counts.all}` },
      { value: 'pending', label: `대기 ${counts.pending}` },
      { value: 'approved', label: `승인 ${counts.approved}` },
      { value: 'enrolled', label: `수강 등록 ${counts.enrolled}` },
      { value: 'rejected', label: `반려 ${counts.rejected}` },
    ],
    [counts],
  )

  return (
    <div className="page-layout">
      <PageHeader
        kicker="ADMIN"
        title="수강 신청 관리"
        description="학생의 수강 신청을 검토하고 승인/반려 상태를 관리할 수 있습니다."
      />

      <Card className="surface-card filter-card">
        <Space wrap size="middle" className="filter-row">
          <Segmented<StatusFilter> options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
          <Text type="secondary">
            {counts.pending > 0 ? `${counts.pending}건이 검토를 기다리고 있습니다.` : '대기 중인 신청이 없습니다.'}
          </Text>
        </Space>
      </Card>

      <ErrorAlert error={applications.error} fallback="수강 신청 정보를 불러오지 못했습니다." />

      <Card className="surface-card">
        <ApplicationsTable
          applications={visible}
          loading={applications.isPending}
          busyId={setStatus.isPending ? setStatus.variables?.id : null}
          onApprove={handleApprove}
          onReject={handleReject}
          emptyText={statusFilter === 'all' ? '신청 내역이 없습니다.' : '이 상태의 신청이 없습니다.'}
        />
      </Card>
    </div>
  )
}
