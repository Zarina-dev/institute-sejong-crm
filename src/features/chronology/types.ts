/**
 * 연혁 — one line of the institute's history. The year is always known, the
 * month usually, the day rarely, so all three are separate and the missing
 * ones stay missing.
 */
export type ChronologyEntry = {
  id: string
  year: number
  month: number | null
  day: number | null
  title: string
  description: string
  /** Founding, accreditation, a new building — drawn larger on the timeline. */
  isMilestone: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type ChronologyEntryInput = {
  year: number
  month?: number | null
  day?: number | null
  title: string
  description?: string
  isMilestone?: boolean
  isPublished?: boolean
}
