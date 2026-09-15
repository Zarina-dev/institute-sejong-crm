export type AppRoute = {
  key: string
  label: string
  path: string
}

export type InstituteInfo = {
  name: string
  tagline: string
  mission: string
  programs: string[]
  academicInfo: string
  contact: {
    email: string
    phone: string
    address: string
  }
}

export type ScheduleItem = {
  id: string
  date: string
  day: string
  time: string
  subject: string
  teacher: string
  classroom: string
  courseGroup: string
}

export type NewsItem = {
  id: string
  title: string
  content: string
  author: string
  publishedAt: string
  status: 'draft' | 'published'
}

export type MaterialItem = {
  id: string
  title: string
  description: string | null
  subject: string
  course: string
  fileType?: string | null
  fileSize?: number | null
  originalFileName?: string | null
  storageKey?: string | null
  thumbnailUrl?: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type MaterialListResponse = {
  items: MaterialItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type StudentResult = {
  id: string
  studentId: string
  subject: string
  exam: string
  score: number
  grade: string
  semester: string
  academicYear: string
  examDate: string
}

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

export type CourseApplicationRecord = {
  id: string
  applicantName: string
  applicantEmail: string
  phone?: string | null
  goal?: string | null
  status?: 'pending' | 'approved' | 'rejected' | 'enrolled' | null
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
