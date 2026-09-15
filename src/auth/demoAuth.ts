export type DemoRole = 'admin' | 'student'

export type DemoSession = {
  username: string
  role: DemoRole
  displayName: string
  studentId?: string
  student?: Partial<StudentRecord>
}

export type StudentRecord = {
  id: string
  name: string
  studentId: string
  email: string
  phone: string
  course: string
  level: string
  admissionDate: string
  status: 'active' | 'inactive'
  topikFiles?: Array<{
    id: string
    name: string
    size: number
    type: string
  }>
}

const STORAGE_KEY = 'institut-demo-session'
const STUDENTS_STORAGE_KEY = 'institut-students'

export const demoUsers: Record<DemoRole, { username: string; password: string; displayName: string }> = {
  admin: {
    username: 'admin',
    password: 'admin123',
    displayName: 'Admin',
  },
  student: {
    username: 'student',
    password: 'student123',
    displayName: 'Student',
  },
}

/* --------------------------------------------------------------------------
   Session store

   `getSession()` is read during render, so it must return a *stable* object
   for an unchanged session — otherwise useSyncExternalStore (see
   useSession.ts) would see a new snapshot on every pass and re-render
   forever. We therefore memoise the parse and only redo it when the raw
   string actually differs.
   -------------------------------------------------------------------------- */

let cachedRaw: string | null = null
let cachedSession: DemoSession | null = null
const listeners = new Set<() => void>()

function readRaw(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(STORAGE_KEY)
}

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export function getSession(): DemoSession | null {
  const raw = readRaw()

  if (raw === cachedRaw) {
    return cachedSession
  }

  cachedRaw = raw

  if (!raw) {
    cachedSession = null
    return cachedSession
  }

  try {
    cachedSession = JSON.parse(raw) as DemoSession
  } catch {
    cachedSession = null
  }

  return cachedSession
}

/** Subscribes to session changes in this tab and in other tabs. */
export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener)

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function setSession(session: DemoSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  notify()
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
  notify()
}

/* --------------------------------------------------------------------------
   Demo login
   -------------------------------------------------------------------------- */

function getStudentRecords(): StudentRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STUDENTS_STORAGE_KEY)

    if (!raw) {
      return []
    }

    return JSON.parse(raw) as StudentRecord[]
  } catch {
    return []
  }
}

function findStudentByLogin(username: string): StudentRecord | undefined {
  const normalized = username.trim().toLowerCase()

  return getStudentRecords().find(
    (student) => student.studentId.trim().toLowerCase() === normalized,
  )
}

export function validateDemoLogin(username: string, password: string): DemoSession | null {
  const normalizedUsername = username.trim()

  for (const [role, user] of Object.entries(demoUsers) as Array<[DemoRole, (typeof demoUsers)[DemoRole]]>) {
    if (user.username === normalizedUsername && user.password === password) {
      return {
        username: user.username,
        role,
        displayName: user.displayName,
      } satisfies DemoSession
    }
  }

  const matchedStudent = findStudentByLogin(normalizedUsername)

  if (matchedStudent && matchedStudent.status === 'active') {
    return {
      username: matchedStudent.studentId,
      role: 'student',
      displayName: matchedStudent.name,
      studentId: matchedStudent.studentId,
    }
  }

  return null
}

export function getStudentLoginStatus(username: string) {
  const matchedStudent = findStudentByLogin(username)

  if (!matchedStudent) {
    return null
  }

  return matchedStudent.status === 'active'
    ? { valid: true, student: matchedStudent }
    : { valid: false, student: matchedStudent, reason: '비활동 상태의 학생은 사이트에 접속할 수 없습니다.' }
}

export function isAdminSession() {
  return getSession()?.role === 'admin'
}

export function isStudentSession() {
  return getSession()?.role === 'student'
}
