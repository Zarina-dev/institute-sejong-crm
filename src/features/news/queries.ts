import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createNews, deleteNews, getAllNews, getPublishedNews, setNewsPublished, updateNews } from './api'
import type { NewsInput } from './types'

export const newsKeys = {
  all: ['news'] as const,
  published: (limit?: number) => [...newsKeys.all, 'published', { limit }] as const,
  admin: () => [...newsKeys.all, 'admin'] as const,
}

export function usePublishedNews(limit?: number) {
  return useQuery({ queryKey: newsKeys.published(limit), queryFn: () => getPublishedNews(limit) })
}

export function useAllNews() {
  return useQuery({ queryKey: newsKeys.admin(), queryFn: getAllNews })
}

function useInvalidateNews() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: newsKeys.all })
}

export function useCreateNews() {
  const invalidate = useInvalidateNews()
  return useMutation({ mutationFn: (payload: NewsInput) => createNews(payload), onSuccess: invalidate })
}

export function useUpdateNews() {
  const invalidate = useInvalidateNews()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NewsInput> }) => updateNews(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNews() {
  const invalidate = useInvalidateNews()
  return useMutation({ mutationFn: (id: string) => deleteNews(id), onSuccess: invalidate })
}

export function useSetNewsPublished() {
  const invalidate = useInvalidateNews()
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => setNewsPublished(id, published),
    onSuccess: invalidate,
  })
}
