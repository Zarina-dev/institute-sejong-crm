import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTerm, deleteTerm, getTerms, updateTerm } from './api'
import type { AcademicTermInput } from './types'

export const termKeys = { all: ['terms'] as const }

export function useTerms() {
  return useQuery({ queryKey: termKeys.all, queryFn: getTerms, staleTime: 5 * 60_000 })
}

function useInvalidateTerms() {
  const queryClient = useQueryClient()
  // Courses carry a term, so their lists are stale too once the dates move.
  return () => {
    queryClient.invalidateQueries({ queryKey: termKeys.all })
    queryClient.invalidateQueries({ queryKey: ['courses'] })
  }
}

export function useCreateTerm() {
  const invalidate = useInvalidateTerms()
  return useMutation({ mutationFn: (payload: AcademicTermInput) => createTerm(payload), onSuccess: invalidate })
}

export function useUpdateTerm() {
  const invalidate = useInvalidateTerms()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AcademicTermInput> }) => updateTerm(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteTerm() {
  const invalidate = useInvalidateTerms()
  return useMutation({ mutationFn: (id: string) => deleteTerm(id), onSuccess: invalidate })
}
