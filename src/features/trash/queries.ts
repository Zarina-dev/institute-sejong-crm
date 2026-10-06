import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getTrash, purgeTrashItem, restoreTrashItem } from './api'

export const trashKeys = {
  all: ['trash'] as const,
}

export function useTrash() {
  return useQuery({ queryKey: trashKeys.all, queryFn: getTrash })
}

/**
 * A restored record can belong to any list on the site — a course, a
 * semester that re-files events, an album — so every cached query is
 * refetched rather than guessing which ones it shows up in.
 */
export function useRestoreTrashItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: restoreTrashItem,
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function usePurgeTrashItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: purgeTrashItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trashKeys.all }),
  })
}
