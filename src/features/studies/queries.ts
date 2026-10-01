import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createStudy, deleteStudy, getAllStudies, getStudies, updateStudy } from './api'
import type { StudyAbroadInput } from './types'

export const studyKeys = {
  all: ['studies'] as const,
  published: () => [...studyKeys.all, 'published'] as const,
  admin: () => [...studyKeys.all, 'admin'] as const,
}

export function useStudies() {
  return useQuery({ queryKey: studyKeys.published(), queryFn: getStudies, staleTime: 5 * 60_000 })
}

export function useAllStudies() {
  return useQuery({ queryKey: studyKeys.admin(), queryFn: getAllStudies })
}

function useInvalidateStudies() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: studyKeys.all })
}

export function useCreateStudy() {
  const invalidate = useInvalidateStudies()
  return useMutation({ mutationFn: (payload: StudyAbroadInput) => createStudy(payload), onSuccess: invalidate })
}

export function useUpdateStudy() {
  const invalidate = useInvalidateStudies()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<StudyAbroadInput> }) => updateStudy(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteStudy() {
  const invalidate = useInvalidateStudies()
  return useMutation({ mutationFn: (id: string) => deleteStudy(id), onSuccess: invalidate })
}
