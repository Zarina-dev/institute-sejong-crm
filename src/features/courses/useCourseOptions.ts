import { useMemo } from 'react'

import { groupCourses } from './grouping'
import { useCourses } from './queries'

type Option = { value: string; label: string; searchText: string }
type GroupedOption = { label: string; title: string; options: Option[] }

const NO_GROUPS: GroupedOption[] = []

/** Matches on programme *and* class name, e.g. "한국 1" finds 한국어 · 한국어 1. */
export const filterCourseOption = (input: string, option?: Option | GroupedOption) =>
  Boolean(option && 'searchText' in option && option.searchText.toLowerCase().includes(input.trim().toLowerCase()))

/**
 * Select options backed by real course records, grouped the way every list
 * shows them: programme (title) → classes (subject). Pass `showSearch` and
 * `filterOption={filterCourseOption}` to the Select.
 */
export function useCourseOptions(publishedOnly = false) {
  const courses = useCourses(publishedOnly)

  const courseOptions = useMemo<GroupedOption[]>(
    () =>
      courses.data
        ? groupCourses(courses.data).map((group) => ({
            label: group.title,
            title: group.title,
            options: group.courses.map((course) => ({
              value: course.id,
              label: course.subject || course.title,
              searchText: `${course.title} ${course.subject}`,
            })),
          }))
        : NO_GROUPS,
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
