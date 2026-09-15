import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'

export type StudentApiRecord = {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  course: string
  level: string
  admissionDate: string
  status: 'active' | 'inactive'
  password?: string
  /** Admin-only memo; absent from the public `/students/:id` response. */
  notes?: string | null
  topikFiles: Array<{
    id: string
    name: string
    size: number
    type: string
  }>
}

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

/** Resolves with the student, or rejects with an ApiError (401/403) carrying a localized message. */
export async function loginStudent(studentId: string, password: string) {
  return apiPost<{ valid: true; student: Omit<StudentApiRecord, 'password' | 'notes'> }>('/students/login', {
    studentId,
    password,
  })
}
