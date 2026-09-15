import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { CourseApplicationRecord, CourseRecord, EnrollmentRecord, TimetableEntry, TimetableFilters } from './types'

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

export async function getApplications() {
  return apiGet<CourseApplicationRecord[]>('/courses/applications/list')
}

export async function createApplication(payload: Record<string, unknown>) {
  return apiPost<CourseApplicationRecord>('/courses/applications', payload)
}

export async function approveApplication(id: string) {
  return apiPatch<CourseApplicationRecord>(`/courses/applications/${id}/status`, { status: 'approved' })
}

export async function rejectApplication(id: string) {
  return apiPatch<CourseApplicationRecord>(`/courses/applications/${id}/status`, { status: 'rejected' })
}

export async function getEnrollments() {
  return apiGet<EnrollmentRecord[]>('/courses/enrollments')
}

export async function getStudentEnrollments(studentId: string) {
  return apiGet<EnrollmentRecord[]>(`/courses/students/${studentId}/enrollments`)
}

export async function createEnrollment(payload: Record<string, unknown>) {
  return apiPost<EnrollmentRecord>('/courses/enrollments', payload)
}

/** Generated timetable for a date range — read-only, derived from published courses' sessions. */
export const getTimetable = (filters: TimetableFilters) => apiGet<TimetableEntry[]>('/schedule', filters)
