import { App, Card, Segmented, Space, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { statusLabelKey } from '../../features/courses/applicationStatus'
import { ApplicationsTable } from '../../features/courses/ApplicationsTable'
import { useApplications, useSetApplicationStatus } from '../../features/courses/queries'
import type { ApplicationStatus, CourseApplicationRecord } from '../../features/courses/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

type StatusFilter = ApplicationStatus | 'all'

export function ApplicationsAdminPage() {
  const { t } = usePreferences()
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
          onSuccess: () =>
            message.success(t('courses.statusChanged', { name: application.applicantName, status: t(statusLabelKey(status)) })),
          onError: (err) => message.error(getErrorMessage(err, t('courses.statusChangeFailed'))),
        },
      )
    },
    [message, setStatus, t],
  )

  const handleApprove = useCallback((a: CourseApplicationRecord) => change(a, 'approved'), [change])
  const handleReject = useCallback((a: CourseApplicationRecord) => change(a, 'rejected'), [change])

  const filterOptions = useMemo(
    (): Array<{ value: StatusFilter; label: string }> => [
      { value: 'all', label: `${t('common.all')} ${counts.all}` },
      { value: 'pending', label: `${t('courses.appStatus.pending')} ${counts.pending}` },
      { value: 'approved', label: `${t('courses.appStatus.approved')} ${counts.approved}` },
      { value: 'enrolled', label: `${t('courses.appStatus.enrolled')} ${counts.enrolled}` },
      { value: 'rejected', label: `${t('courses.appStatus.rejected')} ${counts.rejected}` },
    ],
    [counts, t],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('courses.applicationsTitle')} description={t('courses.applicationsSubtitle')} />

      <Card className="surface-card filter-card">
        <Space wrap size="middle" className="filter-row">
          <Segmented<StatusFilter> options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
          <Text type="secondary">
            {counts.pending > 0 ? t('courses.waitingReview', { count: counts.pending }) : t('courses.noWaiting')}
          </Text>
        </Space>
      </Card>

      <ErrorAlert error={applications.error} fallback={t('courses.loadFailed')} />

      <Card className="surface-card">
        <ApplicationsTable
          applications={visible}
          loading={applications.isPending}
          busyId={setStatus.isPending ? setStatus.variables?.id : null}
          onApprove={handleApprove}
          onReject={handleReject}
          emptyText={statusFilter === 'all' ? t('courses.appsEmpty') : t('courses.appsEmptyFiltered')}
        />
      </Card>
    </div>
  )
}
