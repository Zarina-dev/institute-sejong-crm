import type { CourseRecord } from './types'

/**
 * Courses form a two-level tree: `title` is the programme (한국어, 영어,
 * 기타…) and `subject` the class inside it (한국어 1, beginner, 부채춤…).
 * Every list in the app shows them that way; this is the one place that
 * decides grouping and order.
 */
export type CourseGroup = {
  title: string
  courses: CourseRecord[]
}

// Numeric-aware so "한국어 2" sorts before "한국어 10".
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const compareNatural = (a: string, b: string) => collator.compare(a, b)

export function groupCourses(courses: readonly CourseRecord[] | undefined): CourseGroup[] {
  const byTitle = new Map<string, CourseRecord[]>()

  for (const course of courses ?? []) {
    const key = course.title.trim()
    const bucket = byTitle.get(key)

    if (bucket) {
      bucket.push(course)
    } else {
      byTitle.set(key, [course])
    }
  }

  return Array.from(byTitle, ([title, list]) => ({
    title,
    courses: [...list].sort((a, b) => compareNatural(a.subject, b.subject)),
  })).sort((a, b) => compareNatural(a.title, b.title))
}

/** Distinct programme titles, for the "add course" form and filters. */
export function courseTitles(courses: readonly CourseRecord[] | undefined): string[] {
  return groupCourses(courses).map((group) => group.title)
}

/** "한국어 · 한국어 1" — the full name of one class. */
export function courseLabel(course: Pick<CourseRecord, 'title' | 'subject'>) {
  return course.subject ? `${course.title} · ${course.subject}` : course.title
}
