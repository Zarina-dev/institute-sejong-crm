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

export async function createStudent(payload: Record<string, unknown>) {
  return apiPost<StudentApiResponse>('/students', payload)
}

export async function updateStudent(id: string, payload: Record<string, unknown>) {
  return apiPatch<StudentApiResponse>(`/students/${id}`, payload)
}

export async function deleteStudent(id: string) {
  return apiDelete<{ success: boolean }>(`/students/${id}`)
}

export async function loginStudent(studentId: string, password: string) {
  return apiPost<{ valid: boolean; student?: StudentApiRecord; reason?: string }>('/students/login', {
    studentId,
    password,
  })
}
