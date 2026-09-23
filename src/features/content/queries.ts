import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { usePreferences } from '../../app/preferences'
import { getAllContent, getContent, saveContent, type ContentSlug } from './api'

export const contentKeys = {
  all: ['content'] as const,
  locale: (locale: string) => [...contentKeys.all, locale] as const,
  admin: () => [...contentKeys.all, 'admin'] as const,
}

/** Site copy for the current UI language; cached longer than data tables — it rarely changes. */
export function useSiteContent() {
  const { language } = usePreferences()

  return useQuery({
    queryKey: contentKeys.locale(language),
    queryFn: () => getContent(language),
    staleTime: 5 * 60_000,
  })
}

export function useAllContent() {
  return useQuery({ queryKey: contentKeys.admin(), queryFn: getAllContent })
}

export function useSaveContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ slug, locale, ...payload }: { slug: ContentSlug; locale: string; title?: string; body?: string }) =>
      saveContent(slug, locale, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentKeys.all }),
  })
}