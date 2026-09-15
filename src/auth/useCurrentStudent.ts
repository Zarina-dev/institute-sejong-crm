import { useEffect } from 'react'

import { useStudent } from '../features/students/queries'
import { setSession, type StudentRecord } from './demoAuth'
import { useSession } from './useSession'

/**
 * The signed-in student, kept fresh.
 *
 * The session only stores a snapshot of the student taken at login, so a
 * course approved afterwards never showed up until a re-login. This re-reads
 * the student from the API and writes the result back into the session, so
 * every consumer of `useSession()` sees the same up-to-date record.
 *
 * Until the first response arrives the snapshot is returned, so pages render
 * immediately instead of flashing empty.
 */
export function useCurrentStudent() {
  const session = useSession()
  const studentId = session?.role === 'student' ? (session.studentId ?? session.username) : undefined
  const query = useStudent(studentId)

  useEffect(() => {
    if (!query.data || !session || session.role !== 'student') {
      return
    }

    // Only write when something actually changed; setSession notifies every
    // subscriber, and a no-op write would re-render them all for nothing.
    if (JSON.stringify(session.student) !== JSON.stringify(query.data)) {
      setSession({ ...session, displayName: query.data.name, student: query.data })
    }
  }, [query.data, session])

  const student = (query.data ?? session?.student) as Partial<StudentRecord> | undefined

  return {
    session,
    student,
    isRefreshing: query.isFetching,
    error: query.error,
  }
}
