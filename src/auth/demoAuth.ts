export type DemoRole = 'admin' | 'student'

export type DemoSession = {
  username: string
  role: DemoRole
  displayName: string
  /** API bearer token issued by POST /auth/login (12 h). */
  token: string
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

export function isAdminSession() {
  return getSession()?.role === 'admin'
}

export function isStudentSession() {
  return getSession()?.role === 'student'
}

/** Bearer token for API calls; undefined when signed out. */
export function getAuthToken(): string | undefined {
  return getSession()?.token
}
