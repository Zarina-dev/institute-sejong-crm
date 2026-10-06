import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { CourseRecord, TimetableEntry, TimetableFilters } from './types'

/** One semester and one list, when given; the whole history otherwise. */
export type CourseListFilters = {
  term?: string
  category?: 'language' | 'culture'
}

export async function getCourses(publishedOnly = false, filters: CourseListFilters = {}) {
  return apiGet<CourseRecord[]>(`/courses`, {
    publishedOnly,
    term: filters.term,
    category: filters.category,
  })
}

/** How many classes each semester has — for greying out empty ones in a picker. */
export async function getCourseTermCounts(publishedOnly: boolean, category?: CourseListFilters['category']) {
  return apiGet<Array<{ term: string; count: number }>>('/courses/terms', { publishedOnly, category })
}

export async function getCourse(id: string) {
  return apiGet<CourseRecord>(`/courses/${id}`)
}

export async function createCourse(payload: Record<string, unknown>) {
  return apiPost<CourseRecord>('/courses', payload)
}

export async function updateCourse(id: string, payload: Record<string, unknown>) {
  return apiPatch<CourseRecord>(`/courses/${id}`, payload)
}

export async function deleteCourse(id: string) {
  return apiDelete<{ success: boolean }>(`/courses/${id}`)
}

export async function publishCourse(id: string) {
  return apiPost<CourseRecord>(`/courses/${id}/publish`)
}

export async function unpublishCourse(id: string) {
  return apiPost<CourseRecord>(`/courses/${id}/unpublish`)
}

export const getTimetable = (filters: TimetableFilters) => apiGet<TimetableEntry[]>('/schedule', filters)
