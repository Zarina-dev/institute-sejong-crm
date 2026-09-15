import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createStudent, deleteStudent, getStudents, loginStudent, updateStudent } from './api'

export const studentKeys = {
  all: ['students'] as const,
  list: () => [...studentKeys.all, 'list'] as const,
}

export function useStudents() {
  return useQuery({
    queryKey: studentKeys.list(),
    queryFn: getStudents,
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
