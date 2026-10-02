import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  type CourseListFilters,
  createCourse,
  deleteCourse,
  getCourses,
  getTimetable,
  publishCourse,
  unpublishCourse,
  updateCourse,
} from './api'
import type { TimetableFilters } from './types'

export const courseKeys = {
  all: ['courses'] as const,
  list: (publishedOnly: boolean, filters: CourseListFilters = {}) => [...courseKeys.all, 'list', { publishedOnly, ...filters }] as const,
}

export const timetableKeys = {
  all: ['timetable'] as const,
  list: (filters: TimetableFilters) => [...timetableKeys.all, filters] as const,
}

/* ---------------------------------- queries --------------------------------- */

/**
 * Pass a `term` wherever a page shows one semester — without it the whole
 * history comes down. `enabled: false` while the page is still deciding which
 * semester it is on, so it does not fetch everything first.
 */
export function useCourses(publishedOnly: boolean, filters: CourseListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: courseKeys.list(publishedOnly, filters),
    queryFn: () => getCourses(publishedOnly, filters),
    enabled,
    // Switching semesters keeps the last list on screen instead of a skeleton.
    placeholderData: keepPreviousData,
  })
}

export function useTimetable(filters: TimetableFilters) {
  return useQuery({
    queryKey: timetableKeys.list(filters),
    queryFn: () => getTimetable(filters),
  })
}

/* --------------------------------- mutations -------------------------------- */

/**
 * Courses drive the generated timetable, so every write invalidates both
 * caches — there is no second table to keep in sync.
 */
function useInvalidateCourses() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: courseKeys.all })
    void queryClient.invalidateQueries({ queryKey: timetableKeys.all })
  }
}

export function useCreateCourse() {
  const invalidate = useInvalidateCourses()
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => createCourse(payload), onSuccess: invalidate })
}

export function useUpdateCourse() {
  const invalidate = useInvalidateCourses()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateCourse(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteCourse() {
  const invalidate = useInvalidateCourses()
  return useMutation({ mutationFn: (id: string) => deleteCourse(id), onSuccess: invalidate })
}

export function useSetCoursePublished() {
  const invalidate = useInvalidateCourses()
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => (published ? publishCourse(id) : unpublishCourse(id)),
    onSuccess: invalidate,
  })
}
