import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'

export type StudentApiRecord = {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  /** Display label of the current course (empty when none). */
  course: string
  /** Current course record; set on approval or from the admin form. */
  courseId: string | null
  level: string
  admissionDate: string
  status: 'active' | 'inactive'
  password?: string
  /** Admin-only memo; absent from the public `/students/:id` response. */
  notes?: string | null
  topikFiles: TopikFile[]
  createdAt: string
  updatedAt: string
}

export type TopikFile = {
  id: string
  name: string
  size: number
  type: string
  /** Site-relative `/uploads/documents/…` path; missing on records saved before files were stored. */
  url?: string
}

/** Sentinel stored in `level` for students without a TOPIK certificate. */
export const LEVEL_NONE = 'none'

export type StudentApiResponse = StudentApiRecord

export async function getStudents() {
  return apiGet<StudentApiRecord[]>('/students')
}

/** Password-free copy of one student, by login id. */
export async function getStudent(studentId: string) {
  return apiGet<Omit<StudentApiRecord, 'password' | 'notes'>>(`/students/${encodeURIComponent(studentId)}`)
}

export async function createStudent(payload: Record<string, unknown>) {
  return apiPost<StudentApiResponse>('/students', payload)
}

export async function updateStudent(id: string, payload: Record<string, unknown>) {
  return apiPatch<StudentApiResponse>(`/students/${id}`, payload)
}

export async function deleteStudent(id: string) {
  return apiDelete<{ success: boolean }>(`/students/${id}`)
}
