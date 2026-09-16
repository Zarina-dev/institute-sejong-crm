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
    url?: string
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

   The session lives in sessionStorage, so closing the tab (leaving the site)
   signs the user out — nothing survives to the next visit. sessionStorage is
   per tab, though, and the admin panel / student portal open in a new tab,
   so tabs keep each other in sync over a BroadcastChannel:

     · a tab that starts without a session asks the others for one and waits
       briefly (`isSessionResolving`) before treating the visitor as a guest;
     · login and logout are broadcast so every tab of the site agrees.

   `getSession()` is read during render, so it must return a *stable* object
   for an unchanged session — otherwise useSyncExternalStore (see
   useSession.ts) would see a new snapshot on every pass and re-render
   forever. We therefore memoise the parse and only redo it when the raw
   string actually differs.
   -------------------------------------------------------------------------- */

const LEGACY_STORAGE_KEY = 'institut-demo-session'
const CHANNEL_NAME = 'institut-session'
const HANDSHAKE_TIMEOUT_MS = 300

type SessionMessage =
  | { type: 'request' }
  | { type: 'session'; session: DemoSession }
  | { type: 'clear' }

let cachedRaw: string | null = null
let cachedSession: DemoSession | null = null
let resolving = false
const listeners = new Set<() => void>()

const channel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null

function readRaw(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage.getItem(STORAGE_KEY)
}

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function writeRaw(raw: string | null) {
  if (raw) {
    window.sessionStorage.setItem(STORAGE_KEY, raw)
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY)
  }
}

function finishResolving() {
  if (resolving) {
    resolving = false
    notify()
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

/** True while this tab is still asking sibling tabs whether someone is signed in. */
export function isSessionResolving() {
  return resolving
}

/** Subscribes to session changes in this tab and in other tabs of the site. */
export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function setSession(session: DemoSession) {
  if (typeof window === 'undefined') {
    return
  }

  writeRaw(JSON.stringify(session))
  channel?.postMessage({ type: 'session', session } satisfies SessionMessage)
  notify()
}

export function clearSession() {
  if (typeof window === 'undefined') {
    return
  }

  writeRaw(null)
  channel?.postMessage({ type: 'clear' } satisfies SessionMessage)
  notify()
}

if (typeof window !== 'undefined') {
  // Sessions used to persist in localStorage; anyone still carrying one is
  // signed out once, as the new rule requires.
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)

  if (channel) {
    channel.onmessage = (event: MessageEvent<SessionMessage>) => {
      const message = event.data

      switch (message.type) {
        case 'request': {
          const session = getSession()
          if (session) {
            channel.postMessage({ type: 'session', session } satisfies SessionMessage)
          }
          break
        }
        case 'session':
          writeRaw(JSON.stringify(message.session))
          finishResolving()
          notify()
          break
        case 'clear':
          writeRaw(null)
          notify()
          break
      }
    }

    if (!readRaw()) {
      resolving = true
      channel.postMessage({ type: 'request' } satisfies SessionMessage)
      window.setTimeout(finishResolving, HANDSHAKE_TIMEOUT_MS)
    }
  }
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
