export type ScheduleEntry = {
  id: string
  /** ISO date, YYYY-MM-DD */
  date: string
  /** HH:mm */
  startTime: string
  endTime: string
  subject: string
  teacher: string | null
  classroom: string | null
  courseGroup: string | null
  createdAt: string
  updatedAt: string
}

export type ScheduleInput = {
  date: string
  startTime: string
  endTime: string
  subject: string
  teacher?: string | null
  classroom?: string | null
  courseGroup?: string | null
}

export type ScheduleFilters = {
  from: string
  to: string
  courseGroup?: string
  subject?: string
}
