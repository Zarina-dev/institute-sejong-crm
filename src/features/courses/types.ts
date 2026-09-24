/** ISO weekday: 1 = Monday … 7 = Sunday. Times are HH:mm. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type CourseSession = {
  weekday: Weekday
  startTime: string
  endTime: string
  /** Overrides the course's default classroom for this slot. */
  classroom?: string | null
}

export type CourseCategory = 'language' | 'culture'

export type CourseRecord = {
  id: string
  title: string
  description?: string | null
  subject: string
  /** 강좌 안내 (language) or 문화 강좌 (culture); older rows default to language. */
  category?: CourseCategory
  level?: string | null
  teacherName?: string | null
  /** Weekly meeting pattern; the public timetable is generated from it. */
  sessions: CourseSession[]
  classroom?: string | null
  courseCode?: string | null
  startDate?: string | null
  endDate?: string | null
  capacity: number
  /* ---- Semester table (학사 일정) ---- */
  /** 예상수 */
  expectedStudents?: number | null
  /** 실제수 */
  actualStudents?: number | null
  /** 총 시간수 — teaching hours for the whole semester. */
  totalHours?: number | null
  /** 주 시간 — derived from the sessions unless the admin overrode it. */
  weeklyHours?: number | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

/** One generated class on a concrete date — what `GET /schedule` returns. */
export type TimetableEntry = {
  id: string
  courseId: string
  date: string
  startTime: string
  endTime: string
  subject: string
  title: string
  teacher: string | null
  classroom: string | null
  courseGroup: string
}

export type TimetableFilters = {
  from: string
  to: string
  courseGroup?: string
  subject?: string
}



