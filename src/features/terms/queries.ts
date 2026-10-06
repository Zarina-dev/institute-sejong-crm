import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createTerm, deleteTerm, getTermUsage, getTerms, updateTerm } from './api'
import type { AcademicTermInput } from './types'

export const termKeys = { all: ['terms'] as const, usage: ['terms', 'usage'] as const }

export function useTerms() {
  return useQuery({ queryKey: termKeys.all, queryFn: getTerms, staleTime: 5 * 60_000 })
}

/**
 * Classes and events are added elsewhere, so this is read fresh each time
 * 학기 관리 opens rather than kept in step by every mutation that files one.
 */
export function useTermUsage() {
  return useQuery({ queryKey: termKeys.usage, queryFn: getTermUsage, staleTime: 0 })
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
