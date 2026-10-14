import type { CourseRecord, TimetableEntry } from '../features/courses/types'
import type { NewsPost } from '../features/news/types'
import type { Textbook } from '../features/textbooks/types'
import type { Language } from '../i18n'
import { translated } from './translations'

/**
 * Records as a public page shows them: each text in the reader's language,
 * the Korean wherever it has not been translated. Applied where the public
 * pages load the data, so every card, table and grouping below reads the
 * same language; the admin pages work on the Korean.
 */
export const localizeCourse = (course: CourseRecord, language: Language): CourseRecord =>
  language === 'ko'
    ? course
    : {
        ...course,
        title: translated(course, 'title', language),
        subject: translated(course, 'subject', language),
        description: course.description ? translated(course, 'description', language) : course.description,
        level: course.level ? translated(course, 'level', language) : course.level,
        teacherName: course.teacherName ? translated(course, 'teacherName', language) : course.teacherName,
      }

export const localizeTimetableEntry = (entry: TimetableEntry, language: Language): TimetableEntry => {
  if (language === 'ko') return entry
  const title = translated(entry, 'title', language)
  const teacher = entry.translations?.[language]?.teacherName?.trim()
  return {
    ...entry,
    title,
    courseGroup: title,
    subject: translated(entry, 'subject', language),
    teacher: entry.teacher ? teacher || entry.teacher : entry.teacher,
  }
}

export const localizePost = (post: NewsPost, language: Language): NewsPost =>
  language === 'ko' ? post : { ...post, title: translated(post, 'title', language), body: translated(post, 'body', language) }

export const localizeTextbook = (textbook: Textbook, language: Language): Textbook =>
  language === 'ko'
    ? textbook
    : {
        ...textbook,
        title: translated(textbook, 'title', language),
        description: translated(textbook, 'description', language),
        purchasePlace: translated(textbook, 'purchasePlace', language),
      }
