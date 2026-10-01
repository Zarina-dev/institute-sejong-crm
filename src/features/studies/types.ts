/**
 * 한국 유학 현황 — one student the institute sent to Korea, as the list on
 * the wall records them: the year they left, who they are, where they went
 * and what they read, plus the programme that took them there.
 */
export type StudyAbroad = {
  id: string
  year: number
  name: string
  university: string
  major: string
  /** 정부초청장학생(GKS), 교환학생, 어학연수 … */
  programme: string
  /** 1년, 4년(학사), 6개월 … */
  duration: string
  photo: string | null
  note: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type StudyAbroadInput = {
  year: number
  name: string
  university?: string
  major?: string
  programme?: string
  duration?: string
  photo?: string | null
  note?: string
  isPublished?: boolean
}
