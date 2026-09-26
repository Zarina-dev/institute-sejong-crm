import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTextbook, deleteTextbook, getAllTextbooks, getPublishedTextbooks, updateTextbook } from './api'
import type { TextbookInput } from './types'

export const textbookKeys = {
  all: ['textbooks'] as const,
  published: () => [...textbookKeys.all, 'published'] as const,
  admin: () => [...textbookKeys.all, 'admin'] as const,
}

export function usePublishedTextbooks() {
  return useQuery({ queryKey: textbookKeys.published(), queryFn: getPublishedTextbooks, staleTime: 5 * 60_000 })
}

export function useAllTextbooks() {
  return useQuery({ queryKey: textbookKeys.admin(), queryFn: getAllTextbooks })
}

function useInvalidateTextbooks() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: textbookKeys.all })
}

export function useCreateTextbook() {
  const invalidate = useInvalidateTextbooks()
  return useMutation({ mutationFn: (payload: TextbookInput) => createTextbook(payload), onSuccess: invalidate })
}

export function useUpdateTextbook() {
  const invalidate = useInvalidateTextbooks()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TextbookInput> }) => updateTextbook(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteTextbook() {
  const invalidate = useInvalidateTextbooks()
  return useMutation({ mutationFn: (id: string) => deleteTextbook(id), onSuccess: invalidate })
}