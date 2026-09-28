import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createChronologyEntry, deleteChronologyEntry, getAllChronology, getChronology, updateChronologyEntry } from './api'
import type { ChronologyEntryInput } from './types'

export const chronologyKeys = {
  all: ['chronology'] as const,
  published: () => [...chronologyKeys.all, 'published'] as const,
  admin: () => [...chronologyKeys.all, 'admin'] as const,
}

export function useChronology() {
  return useQuery({ queryKey: chronologyKeys.published(), queryFn: getChronology, staleTime: 5 * 60_000 })
}

export function useAllChronology() {
  return useQuery({ queryKey: chronologyKeys.admin(), queryFn: getAllChronology })
}

function useInvalidateChronology() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: chronologyKeys.all })
}

export function useCreateChronologyEntry() {
  const invalidate = useInvalidateChronology()
  return useMutation({ mutationFn: (payload: ChronologyEntryInput) => createChronologyEntry(payload), onSuccess: invalidate })
}

export function useUpdateChronologyEntry() {
  const invalidate = useInvalidateChronology()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ChronologyEntryInput> }) => updateChronologyEntry(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteChronologyEntry() {
  const invalidate = useInvalidateChronology()
  return useMutation({ mutationFn: (id: string) => deleteChronologyEntry(id), onSuccess: invalidate })
}
