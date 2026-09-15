import { Tag } from 'antd'
import { memo } from 'react'

import { applicationStatusMeta } from './applicationStatus'
import type { ApplicationStatus } from './types'

export const ApplicationStatusTag = memo(function ApplicationStatusTag({
  status,
}: {
  status: ApplicationStatus | null | undefined
}) {
  const meta = applicationStatusMeta[status ?? 'pending']
  return <Tag color={meta.color}>{meta.label}</Tag>
})
