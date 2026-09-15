import { Tag } from 'antd'
import { memo } from 'react'

import { usePreferences } from '../../app/preferences'
import { applicationStatusColor, statusLabelKey } from './applicationStatus'
import type { ApplicationStatus } from './types'

export const ApplicationStatusTag = memo(function ApplicationStatusTag({
  status,
}: {
  status: ApplicationStatus | null | undefined
}) {
  const { t } = usePreferences()
  const resolved = status ?? 'pending'
  return <Tag color={applicationStatusColor[resolved]}>{t(statusLabelKey(resolved))}</Tag>
})
