import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { dashboardKeys } from '../dashboard/queries'
import {
  type CourseListFilters,
  createCourse,
  deleteCourse,
  getCourseTermCounts,
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
  // Under `all`, so any course write refreshes the counts too.
  termCounts: (publishedOnly: boolean, category?: CourseListFilters['category']) =>
    [...courseKeys.all, 'term-counts', { publishedOnly, category }] as const,
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

/** Classes per semester, as a lookup for TermPicker's `counts`. */
export function useCourseTermCounts(publishedOnly: boolean, category?: CourseListFilters['category']) {
  return useQuery({
    queryKey: courseKeys.termCounts(publishedOnly, category),
    queryFn: () => getCourseTermCounts(publishedOnly, category),
    select: (rows) => new Map(rows.map((row) => [row.term, row.count])),
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
    // The admin dashboard counts courses on the server.
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
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
