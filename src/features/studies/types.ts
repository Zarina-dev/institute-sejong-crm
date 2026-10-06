/** The texts kept in both languages: Korean in `field`, Kyrgyz in `fieldKy`. */
export const BILINGUAL_FIELDS = ['name', 'university', 'major', 'programme', 'duration', 'note'] as const
export type BilingualField = (typeof BILINGUAL_FIELDS)[number]

/**
 * 한국 유학 현황 — one student the institute sent to Korea, as the list on
 * the wall records them: the year they left, who they are, where they went
 * and what they read, plus the programme that took them there. Every text
 * is kept in Korean and in Kyrgyz; either may be empty.
 */
export type StudyAbroad = {
  id: string
  year: number
  name: string
  nameKy: string
  university: string
  universityKy: string
  major: string
  majorKy: string
  /** 정부초청장학생(GKS), 교환학생, 어학연수 … */
  programme: string
  programmeKy: string
  /** 1년, 4년(학사), 6개월 … */
  duration: string
  durationKy: string
  photo: string | null
  note: string
  noteKy: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type StudyAbroadInput = Partial<Record<BilingualField | `${BilingualField}Ky`, string>> & {
  year: number
  photo?: string | null
  isPublished?: boolean
}
