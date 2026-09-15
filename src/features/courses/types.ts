export type CourseRecord = {
  id: string
  title: string
  description?: string | null
  subject: string
  level?: string | null
  teacherName?: string | null
  schedule?: string | null
  classroom?: string | null
  courseCode?: string | null
  startDate?: string | null
  endDate?: string | null
  capacity: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'enrolled'

export type CourseApplicationRecord = {
  id: string
  applicantName: string
  applicantEmail: string
  phone?: string | null
  goal?: string | null
  status?: ApplicationStatus | null
  courseId: string
  course?: CourseRecord
  studentId?: string | null
  student?: {
    id: string
    name: string
    studentId: string
  }
  documents?: Array<{
    id: string
    name: string
    size: number
    type: string
    dataUrl?: string
  }>
  createdAt: string
  updatedAt: string
}

export type EnrollmentRecord = {
  id: string
  courseId: string
  course?: CourseRecord
  studentId: string
  student?: {
    id: string
    name: string
    studentId: string
  }
  status?: 'active' | 'completed' | 'paused' | null
  createdAt: string
  updatedAt: string
}
