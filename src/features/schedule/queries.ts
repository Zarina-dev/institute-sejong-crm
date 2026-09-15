import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createScheduleEntry, deleteScheduleEntry, getSchedule, updateScheduleEntry } from './api'
import type { ScheduleFilters, ScheduleInput } from './types'

export const scheduleKeys = {
  all: ['schedule'] as const,
  list: (filters: ScheduleFilters) => [...scheduleKeys.all, 'list', filters] as const,
}

export function useSchedule(filters: ScheduleFilters) {
  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: () => getSchedule(filters),
    // Paging week by week keeps the previous week on screen until the next arrives.
    placeholderData: keepPreviousData,
  })
}

function useInvalidateSchedule() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: scheduleKeys.all })
}

export function useCreateScheduleEntry() {
  const invalidate = useInvalidateSchedule()
  return useMutation({ mutationFn: (payload: ScheduleInput) => createScheduleEntry(payload), onSuccess: invalidate })
}

export function useUpdateScheduleEntry() {
  const invalidate = useInvalidateSchedule()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ScheduleInput> }) => updateScheduleEntry(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteScheduleEntry() {
  const invalidate = useInvalidateSchedule()
  return useMutation({ mutationFn: (id: string) => deleteScheduleEntry(id), onSuccess: invalidate })
}
