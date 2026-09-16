import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createStaff, deleteStaff, getAllStaff, getPublishedStaff, updateStaff } from './api'
import type { StaffInput } from './types'

export const staffKeys = {
  all: ['staff'] as const,
  published: () => [...staffKeys.all, 'published'] as const,
  admin: () => [...staffKeys.all, 'admin'] as const,
}

export function usePublishedStaff() {
  return useQuery({ queryKey: staffKeys.published(), queryFn: getPublishedStaff, staleTime: 5 * 60_000 })
}

export function useAllStaff() {
  return useQuery({ queryKey: staffKeys.admin(), queryFn: getAllStaff })
}

function useInvalidateStaff() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: staffKeys.all })
}

export function useCreateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({ mutationFn: (payload: StaffInput) => createStaff(payload), onSuccess: invalidate })
}

export function useUpdateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<StaffInput> }) => updateStaff(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({ mutationFn: (id: string) => deleteStaff(id), onSuccess: invalidate })
}
