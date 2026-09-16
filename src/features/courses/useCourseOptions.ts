import { useMemo } from 'react'

import { useCourses } from './queries'

const NO_OPTIONS: Array<{ value: string; label: string }> = []

/**
 * Select options backed by real course records — for every place that used
 * to take a free-text course name (materials, students). Courses are
 * labelled "title · subject"; subjects are the distinct values across them.
 */
export function useCourseOptions(publishedOnly = false) {
  const courses = useCourses(publishedOnly)

  const courseOptions = useMemo(
    () =>
      courses.data?.map((course) => ({
        value: course.id,
        label: course.subject ? `${course.title} · ${course.subject}` : course.title,
      })) ?? NO_OPTIONS,
    [courses.data],
  )

  const subjectOptions = useMemo(
    () =>
      Array.from(new Set((courses.data ?? []).map((course) => course.subject).filter(Boolean)))
        .sort()
        .map((subject) => ({ value: subject, label: subject })),
    [courses.data],
  )

  return { courses, courseOptions, subjectOptions }
}
