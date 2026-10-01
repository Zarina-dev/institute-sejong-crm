import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCompetition, deleteCompetition, getAllCompetitions, getCompetitions, getPublishedCompetitions, updateCompetition } from './api'
import type { CompetitionInput, CompetitionKind } from './types'

export const competitionKeys = {
  all: ['competitions'] as const,
  kind: (kind: CompetitionKind) => [...competitionKeys.all, kind] as const,
  published: () => [...competitionKeys.all, 'published'] as const,
  admin: () => [...competitionKeys.all, 'admin'] as const,
}

export function useCompetitions(kind: CompetitionKind) {
  return useQuery({ queryKey: competitionKeys.kind(kind), queryFn: () => getCompetitions(kind), staleTime: 5 * 60_000 })
}

/** Both competitions in one list — the public page keeps them together. */
export function usePublishedCompetitions() {
  return useQuery({ queryKey: competitionKeys.published(), queryFn: getPublishedCompetitions, staleTime: 5 * 60_000 })
}

export function useAllCompetitions() {
  return useQuery({ queryKey: competitionKeys.admin(), queryFn: getAllCompetitions })
}

function useInvalidateCompetitions() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: competitionKeys.all })
}

export function useCreateCompetition() {
  const invalidate = useInvalidateCompetitions()
  return useMutation({ mutationFn: (payload: CompetitionInput) => createCompetition(payload), onSuccess: invalidate })
}

export function useUpdateCompetition() {
  const invalidate = useInvalidateCompetitions()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CompetitionInput> }) => updateCompetition(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteCompetition() {
  const invalidate = useInvalidateCompetitions()
  return useMutation({ mutationFn: (id: string) => deleteCompetition(id), onSuccess: invalidate })
}
