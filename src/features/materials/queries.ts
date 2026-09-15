import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createMaterial,
  deleteMaterial,
  getMaterials,
  publishMaterial,
  unpublishMaterial,
  updateMaterial,
} from './api'
import type { MaterialsFilters } from './types'

/**
 * Query-key factory. Every key for this feature starts with `all`, so one
 * `invalidateQueries({ queryKey: materialKeys.all })` refreshes every list,
 * whatever filters it was fetched with.
 */
export const materialKeys = {
  all: ['materials'] as const,
  lists: () => [...materialKeys.all, 'list'] as const,
  list: (filters: MaterialsFilters) => [...materialKeys.lists(), filters] as const,
}

type MaterialsQueryOptions = {
  /** Skip the request entirely — e.g. a student with no approved course. */
  enabled?: boolean
}

export function useMaterials(filters: MaterialsFilters, { enabled = true }: MaterialsQueryOptions = {}) {
  return useQuery({
    queryKey: materialKeys.list(filters),
    queryFn: () => getMaterials(filters),
    // Paging/filtering keeps the previous page on screen until the next one
    // arrives, instead of collapsing the grid to a spinner between pages.
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** Shared "refetch every materials list" for the mutations below. */
function useInvalidateMaterials() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: materialKeys.all })
}

export function useCreateMaterial() {
  const invalidate = useInvalidateMaterials()

  return useMutation({
    mutationFn: (formData: FormData) => createMaterial(formData),
    onSuccess: invalidate,
  })
}

export function useUpdateMaterial() {
  const invalidate = useInvalidateMaterials()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateMaterial(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteMaterial() {
  const invalidate = useInvalidateMaterials()

  return useMutation({
    mutationFn: (id: string) => deleteMaterial(id),
    onSuccess: invalidate,
  })
}

export function useSetMaterialPublished() {
  const invalidate = useInvalidateMaterials()

  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      published ? publishMaterial(id) : unpublishMaterial(id),
    onSuccess: invalidate,
  })
}
