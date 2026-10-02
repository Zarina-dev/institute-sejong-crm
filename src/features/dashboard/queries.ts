import { useQuery } from '@tanstack/react-query'

import { getDashboard } from './api'

/**
 * Course and news writes invalidate `dashboardKeys.all` themselves
 * (useInvalidateCourses, useInvalidateNews), since the counters are theirs.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
}

export function useDashboard() {
  return useQuery({ queryKey: dashboardKeys.summary(), queryFn: getDashboard })
}
