import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { studentKeys } from '../students/queries'
import {
  approveApplication,
  createApplication,
  createCourse,
  createEnrollment,
  deleteCourse,
  getApplications,
  getCourses,
  getEnrollments,
  getStudentEnrollments,
  publishCourse,
  rejectApplication,
  unpublishCourse,
  updateCourse,
} from './api'

export const courseKeys = {
  all: ['courses'] as const,
  list: (publishedOnly: boolean) => [...courseKeys.all, 'list', { publishedOnly }] as const,
}

export const applicationKeys = {
  all: ['applications'] as const,
  list: () => [...applicationKeys.all, 'list'] as const,
}

export const enrollmentKeys = {
  all: ['enrollments'] as const,
  list: () => [...enrollmentKeys.all, 'list'] as const,
  byStudent: (studentId: string) => [...enrollmentKeys.all, 'student', studentId] as const,
}

/* ---------------------------------- queries --------------------------------- */

export function useCourses(publishedOnly: boolean) {
  return useQuery({
    queryKey: courseKeys.list(publishedOnly),
    queryFn: () => getCourses(publishedOnly),
  })
}

export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.list(),
    queryFn: getApplications,
  })
}

export function useEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.list(),
    queryFn: getEnrollments,
  })
}

export function useStudentEnrollments(studentId: string | undefined) {
  return useQuery({
    queryKey: enrollmentKeys.byStudent(studentId ?? ''),
    queryFn: () => getStudentEnrollments(studentId as string),
    enabled: Boolean(studentId),
  })
}

/* --------------------------------- mutations -------------------------------- */

function useInvalidateCourses() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: courseKeys.all })
}

export function useCreateCourse() {
  const invalidate = useInvalidateCourses()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createCourse(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateCourse() {
  const invalidate = useInvalidateCourses()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateCourse(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCourse(id),
    // Applications and enrollments cascade with the course on the backend.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
      ]),
  })
}

export function useSetCoursePublished() {
  const invalidate = useInvalidateCourses()

  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      published ? publishCourse(id) : unpublishCourse(id),
    onSuccess: invalidate,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createApplication(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
  })
}

/**
 * Approving also creates the enrollment and stamps the course title on the
 * student record, so all three caches are stale afterwards.
 */
export function useSetApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      status === 'approved' ? approveApplication(id) : rejectApplication(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: applicationKeys.all }),
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
        queryClient.invalidateQueries({ queryKey: studentKeys.all }),
      ]),
  })
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { studentId: string; courseId: string }) => createEnrollment(payload),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: enrollmentKeys.all }),
        queryClient.invalidateQueries({ queryKey: studentKeys.all }),
      ]),
  })
}
