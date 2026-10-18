import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createMaterial, deleteMaterial, getMaterials, publishMaterial, unpublishMaterial, updateMaterial } from './api'
import type { MaterialsFilters } from './types'
import { useDebouncedValue } from '../../shared/useDebouncedValue'

/**
 * Query-key factory. Every key for this feature starts with `all`, so one
 * `invalidateQueries({ queryKey: materialKeys.all })` refreshes every list,
 * whatever filters it was fetched with.
 */
const materialKeys = {
  all: ['materials'] as const,
  lists: () => [...materialKeys.all, 'list'] as const,
  list: (filters: MaterialsFilters) => [...materialKeys.lists(), filters] as const,
}

type MaterialsQueryOptions = {
  /** Skip the request entirely — e.g. before a filter is chosen. */
  enabled?: boolean
}

export function useMaterials(filters: MaterialsFilters, { enabled = true }: MaterialsQueryOptions = {}) {
  // The search box updates on every key; the request waits for a pause in
  // typing, and a superseded one is cancelled (the signal) rather than left
  // to finish and race the newer answer.
  const search = useDebouncedValue(filters.search)
  const settled = { ...filters, search }

  return useQuery({
    queryKey: materialKeys.list(settled),
    queryFn: ({ signal }) => getMaterials(settled, signal),
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
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateMaterial(id, payload),
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
    mutationFn: ({ id, published }: { id: string; published: boolean }) => (published ? publishMaterial(id) : unpublishMaterial(id)),
    onSuccess: invalidate,
  })
}
