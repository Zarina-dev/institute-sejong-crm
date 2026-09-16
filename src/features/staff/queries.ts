import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createStaff, deleteStaff, getAllStaff, getPublishedStaff, reorderStaff, updateStaff } from './api'
import type { StaffInput, StaffMember } from './types'

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

/**
 * Optimistic: the table shows the dropped order immediately and only snaps
 * back if the server rejects it.
 */
export function useReorderStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => reorderStaff(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: staffKeys.admin() })
      const previous = queryClient.getQueryData<StaffMember[]>(staffKeys.admin())

      if (previous) {
        const position = new Map(ids.map((id, index) => [id, index]))
        queryClient.setQueryData<StaffMember[]>(
          staffKeys.admin(),
          [...previous]
            .map((member) => ({ ...member, sortOrder: position.get(member.id) ?? member.sortOrder }))
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
        )
      }

      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(staffKeys.admin(), context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: staffKeys.all }),
  })
}
