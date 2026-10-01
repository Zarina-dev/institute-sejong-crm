/**
 * 행사 일정 — one event of a semester. The institute prints the name in
 * Korean and in Kyrgyz side by side, so both are part of the record; the
 * month, day and weekday are read off the dates rather than stored.
 */
export type ScheduleEvent = {
  id: string
  /** '2026-2' — which semester's table this belongs to. */
  termCode: string | null
  startDate: string
  /** Set only for events that run over several days. */
  endDate: string | null
  /** 행사명 */
  title: string
  /** Иш-чаранын аталышы */
  titleKy: string
  titleRu: string
  titleEn: string
  note: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type ScheduleEventInput = {
  termCode?: string | null
  startDate: string
  endDate?: string | null
  title: string
  titleKy?: string
  titleRu?: string
  titleEn?: string
  note?: string
  isPublished?: boolean
}
