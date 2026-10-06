import type { Language } from '../../app/preferences'
import type { BilingualField, StudyAbroad } from './types'

/**
 * Which of the two texts a reader sees first: Korean on the Korean site;
 * Kyrgyz for Kyrgyz and Russian readers, who read Cyrillic, and for English
 * ones too — the students are Kyrgyz, and their names are theirs in Cyrillic.
 */
const koreanFirst = (language: Language) => language === 'ko'

/** The text in the reader's language, or the other one when that is empty. */
export function studyText(student: StudyAbroad, field: BilingualField, language: Language) {
  const korean = student[field]?.trim() ?? ''
  const kyrgyz = student[`${field}Ky`]?.trim() ?? ''

  return koreanFirst(language) ? korean || kyrgyz : kyrgyz || korean
}

/**
 * The name in the other script, shown under the main one — 아지모바 굴잔 /
 * Азимова Гулжан — when both exist and differ.
 */
export function otherName(student: StudyAbroad, language: Language) {
  const korean = student.name?.trim() ?? ''
  const kyrgyz = student.nameKy?.trim() ?? ''

  if (!korean || !kyrgyz || korean === kyrgyz) {
    return null
  }

  return koreanFirst(language) ? kyrgyz : korean
}

/** Whether each language has been filled in — for the admin list. */
export const languagesFilled = (student: StudyAbroad) => ({
  ko: Boolean(student.name?.trim()),
  ky: Boolean(student.nameKy?.trim()),
})
