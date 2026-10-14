import type { Language } from '../../i18n'

/** 졸업생 현황 — one student who finished 세종한국어 8책 and graduated. */
export type Graduate = {
  id: string
  year: number
  /** 1 or 2 — the 학기 of that year. */
  term: number
  name: string
  nameKy: string
  /** 비고: what came after — a scholarship, a university, a job. */
  note: string
  noteKy: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type GraduateInput = Pick<Graduate, 'year' | 'term' | 'name' | 'nameKy' | 'note' | 'noteKy' | 'isPublished'>

/**
 * Korean on the Korean site; the Kyrgyz text (Cyrillic) for Kyrgyz, Russian and
 * English readers, as on 한국 유학 현황 — the graduates are Kyrgyz and their
 * names are theirs in Cyrillic. Either falls back to the other.
 */
export function graduateText(graduate: Graduate, field: 'name' | 'note', language: Language) {
  const korean = graduate[field]
  const kyrgyz = graduate[`${field}Ky`]

  return language === 'ko' ? korean || kyrgyz : kyrgyz || korean
}

/** The name in the other script, shown under the first ("아이다 / Айда"), when both exist. */
export function otherGraduateName(graduate: Graduate, language: Language) {
  if (!graduate.name || !graduate.nameKy) return null
  return language === 'ko' ? graduate.nameKy : graduate.name
}
