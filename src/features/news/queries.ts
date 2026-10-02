import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dashboardKeys } from '../dashboard/queries'
import { createNews, deleteNews, getAllNews, getNewsPost, getPublishedNews, setNewsPublished, updateNews } from './api'
import type { NewsInput } from './types'

export const newsKeys = {
  all: ['news'] as const,
  published: (limit?: number) => [...newsKeys.all, 'published', { limit }] as const,
  admin: () => [...newsKeys.all, 'admin'] as const,
  detail: (id: string) => [...newsKeys.all, 'detail', id] as const,
}

export function usePublishedNews(limit?: number) {
  return useQuery({ queryKey: newsKeys.published(limit), queryFn: () => getPublishedNews(limit) })
}

export function useNewsPost(id: string | undefined) {
  return useQuery({ queryKey: newsKeys.detail(id ?? ''), queryFn: () => getNewsPost(id!), enabled: Boolean(id) })
}

export function useAllNews() {
  return useQuery({ queryKey: newsKeys.admin(), queryFn: getAllNews })
}

function useInvalidateNews() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: newsKeys.all })
    // The admin dashboard counts posts on the server.
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
  }
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
