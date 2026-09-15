import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createStudent, deleteStudent, getStudent, getStudents, loginStudent, updateStudent } from './api'

export const studentKeys = {
  all: ['students'] as const,
  list: () => [...studentKeys.all, 'list'] as const,
  detail: (studentId: string) => [...studentKeys.all, 'detail', studentId] as const,
}

export function useStudents() {
  return useQuery({
    queryKey: studentKeys.list(),
    queryFn: getStudents,
  })
}

/**
 * One student by login id. Lives under `studentKeys.all`, so an approval in
 * the admin panel (which invalidates that prefix) refreshes it as well.
 */
export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: studentKeys.detail(studentId ?? ''),
    queryFn: () => getStudent(studentId as string),
    enabled: Boolean(studentId),
    // The portal is often open in a second tab while the admin approves in
    // the first; refetch on focus is the cheapest way to pick that up.
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  })
}

function useInvalidateStudents() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: studentKeys.all })
}

export function useCreateStudent() {
  const invalidate = useInvalidateStudents()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createStudent(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateStudent() {
  const invalidate = useInvalidateStudents()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateStudent(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteStudent() {
  const invalidate = useInvalidateStudents()

  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: invalidate,
  })
}

/** Login is a mutation: it has side effects and must never be cached. */
export function useStudentLogin() {
  return useMutation({
    mutationFn: ({ studentId, password }: { studentId: string; password: string }) =>
      loginStudent(studentId, password),
  })
}
