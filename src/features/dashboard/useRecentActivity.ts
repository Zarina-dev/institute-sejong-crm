import { useMemo } from 'react'

import type { TranslationKey } from '../../app/preferences'
import { useApplications, useCourses } from '../courses/queries'
import { useMaterials } from '../materials/queries'
import { useAllNews } from '../news/queries'
import { useAllStaff } from '../staff/queries'
import { useStudents } from '../students/queries'

export type ActivityKind = 'student' | 'course' | 'application' | 'material' | 'news' | 'staff'

export type ActivityEntry = {
  id: string
  kind: ActivityKind
  /** Primary label: the record's name/title. */
  title: string
  /** Secondary label: course, category, status… Either plain text or a translation key. */
  detail: string
  detailKey?: TranslationKey
  /** ISO timestamp of the change. */
  at: string
  /** True when the record was created at that moment, false when edited later. */
  created: boolean
  /** Admin route that shows the record. */
  to: string
}

type Timestamped = { createdAt: string; updatedAt: string }

/** A row edited within a second of creation still counts as "added". */
function isCreation(row: Timestamped) {
  return Math.abs(new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime()) < 1000
}

const EMPTY: ActivityEntry[] = []

/**
 * "Recent updates" for the admin dashboard, without an audit log: every
 * admin-managed table is read (the same queries the admin pages use, so they
 * are usually already cached) and the newest `updatedAt` rows across all of
 * them are merged into one feed.
 */
export function useRecentActivity(limit = 12) {
  const students = useStudents()
  const courses = useCourses(false)
  const applications = useApplications()
  const materials = useMaterials({ page: 1, limit: 20, published: 'all', sortBy: 'updatedAt' })
  const news = useAllNews()
  const staff = useAllStaff()

  const isPending = students.isPending || courses.isPending || applications.isPending || materials.isPending || news.isPending || staff.isPending

  const entries = useMemo(() => {
    const list: ActivityEntry[] = []

    for (const row of students.data ?? []) {
      list.push({ id: `student-${row.id}`, kind: 'student', title: row.name, detail: `${row.studentId} · ${row.course || '—'}`, at: row.updatedAt, created: isCreation(row), to: '/admin/students' })
    }

    for (const row of courses.data ?? []) {
      list.push({ id: `course-${row.id}`, kind: 'course', title: row.title, detail: row.subject, at: row.updatedAt, created: isCreation(row), to: '/admin/courses' })
    }

    for (const row of applications.data ?? []) {
      list.push({ id: `application-${row.id}`, kind: 'application', title: row.applicantName, detail: row.course?.title ?? '—', at: row.updatedAt, created: isCreation(row), to: '/admin/applications' })
    }

    for (const row of materials.data?.items ?? []) {
      list.push({ id: `material-${row.id}`, kind: 'material', title: row.title, detail: `${row.subject} · ${row.course}`, at: row.updatedAt, created: isCreation(row), to: '/admin/materials' })
    }

    for (const row of news.data ?? []) {
      list.push({ id: `news-${row.id}`, kind: 'news', title: row.title, detail: row.category, detailKey: `news.category.${row.category}`, at: row.updatedAt, created: isCreation(row), to: '/admin/news' })
    }

    for (const row of staff.data ?? []) {
      list.push({ id: `staff-${row.id}`, kind: 'staff', title: row.name, detail: row.position, at: row.updatedAt, created: isCreation(row), to: '/admin/staff' })
    }

    if (list.length === 0) {
      return EMPTY
    }

    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit)
  }, [applications.data, courses.data, limit, materials.data?.items, news.data, staff.data, students.data])

  return { entries, isPending }
}
