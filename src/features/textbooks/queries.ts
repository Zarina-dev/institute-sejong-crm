import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTextbook, deleteTextbook, getAllTextbooks, getPublishedTextbooks, reorderTextbooks, updateTextbook } from './api'
import type { Textbook, TextbookInput } from './types'

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

/** Optimistic: the table shows the dropped order at once, and snaps back only if the server refuses. */
export function useReorderTextbooks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => reorderTextbooks(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: textbookKeys.admin() })
      const previous = queryClient.getQueryData<Textbook[]>(textbookKeys.admin())

      if (previous) {
        const position = new Map(ids.map((id, index) => [id, index]))
        queryClient.setQueryData<Textbook[]>(
          textbookKeys.admin(),
          [...previous]
            .map((textbook) => ({ ...textbook, sortOrder: position.get(textbook.id) ?? textbook.sortOrder }))
            .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
        )
      }

      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(textbookKeys.admin(), context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: textbookKeys.all }),
  })
}
