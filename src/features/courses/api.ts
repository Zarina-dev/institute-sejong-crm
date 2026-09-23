import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { CourseRecord, TimetableEntry, TimetableFilters } from './types'

export async function getCourses(publishedOnly = false) {
  return apiGet<CourseRecord[]>(`/courses`, {
    publishedOnly,
  })
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
