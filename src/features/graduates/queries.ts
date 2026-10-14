import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createGraduate, deleteGraduate, getAllGraduates, getGraduates, updateGraduate } from './api'
import type { GraduateInput } from './types'

export const graduateKeys = {
  all: ['graduates'] as const,
  published: () => [...graduateKeys.all, 'published'] as const,
  admin: () => [...graduateKeys.all, 'admin'] as const,
}

export function useGraduates() {
  return useQuery({ queryKey: graduateKeys.published(), queryFn: getGraduates, staleTime: 5 * 60_000 })
}

export function useAllGraduates() {
  return useQuery({ queryKey: graduateKeys.admin(), queryFn: getAllGraduates })
}

function useInvalidateGraduates() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: graduateKeys.all })
}

export function useCreateGraduate() {
  const invalidate = useInvalidateGraduates()
  return useMutation({ mutationFn: (payload: GraduateInput) => createGraduate(payload), onSuccess: invalidate })
}

export function useUpdateGraduate() {
  const invalidate = useInvalidateGraduates()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GraduateInput> }) => updateGraduate(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteGraduate() {
  const invalidate = useInvalidateGraduates()
  return useMutation({ mutationFn: (id: string) => deleteGraduate(id), onSuccess: invalidate })
}
