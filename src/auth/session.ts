/**
 * Staff session: who is signed in (an account from the API's
 * staff_accounts) and the API token. It lives in `sessionStorage`, so
 * closing the tab signs out — nothing survives to the next visit.
 * `sessionStorage` is per tab and the admin panel opens in a new tab, so
 * tabs stay in sync over a BroadcastChannel:
 *
 *   · a tab that starts without a session asks the others for one and waits
 *     briefly (`isSessionResolving`) before treating the visitor as a guest;
 *   · login and logout are broadcast so every tab of the site agrees.
 *
 * `getSession()` is read during render, so it must return a *stable* object
 * for an unchanged session — otherwise useSyncExternalStore (see
 * useSession.ts) would see a new snapshot on every pass and re-render
 * forever. We therefore memoise the parse and only redo it when the raw
 * string actually differs.
 */
/** ADMIN also manages accounts, reads 작업 기록 and empties the trash; STAFF edits the site. */
export type StaffRole = 'ADMIN' | 'STAFF'

/** The signed-in account, as `/auth/login` and `/auth/me` describe it. */
export type SessionUser = {
  id: string
  username: string
  fullName: string
  role: StaffRole
}

export type AdminSession = SessionUser & {
  /** API bearer token issued by POST /auth/login (12 h). */
  token: string
}

/** Sessions stored before accounts lived in the database lack these; their tokens are refused anyway. */
const isCurrentSession = (value: Partial<AdminSession> | null): value is AdminSession =>
  !!value && typeof value.token === 'string' && typeof value.id === 'string' && (value.role === 'ADMIN' || value.role === 'STAFF')

const STORAGE_KEY = 'institut-admin-session'
const LEGACY_STORAGE_KEYS = ['institut-demo-session', 'institut-students', 'institut-catalog']
const CHANNEL_NAME = 'institut-session'
const HANDSHAKE_TIMEOUT_MS = 300

type SessionMessage = { type: 'request' } | { type: 'session'; session: AdminSession } | { type: 'clear' }

let cachedRaw: string | null = null
let cachedSession: AdminSession | null = null
let resolving = false
const listeners = new Set<() => void>()

const channel: BroadcastChannel | null = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null

function readRaw(): string | null {
  return typeof window === 'undefined' ? null : readStorage('session', STORAGE_KEY)
}

function writeRaw(raw: string | null) {
  writeStorage('session', STORAGE_KEY, raw || null)
}

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

function finishResolving() {
  if (resolving) {
    resolving = false
    notify()
  }
}

export function getSession(): AdminSession | null {
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
    const parsed = JSON.parse(raw) as Partial<AdminSession> | null
    cachedSession = isCurrentSession(parsed) ? parsed : null
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

export function setSession(session: AdminSession) {
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

/**
 * Brings the stored name and role up to date with `/auth/me` — an
 * administrator may have renamed or re-roled the account since sign-in.
 * Nothing is written (or broadcast) when nothing changed.
 */
export function updateSessionUser(user: SessionUser) {
  const session = getSession()

  if (!session || session.id !== user.id) {
    return
  }

  if (session.username !== user.username || session.fullName !== user.fullName || session.role !== user.role) {
    setSession({ ...session, username: user.username, fullName: user.fullName, role: user.role })
  }
}

/** Bearer token for API calls; undefined when signed out. */
export function getAuthToken(): string | undefined {
  return getSession()?.token
}

if (typeof window !== 'undefined') {
  // Sessions and the old localStorage stores (students, 과목/과정 catalog)
  // predate the current design; clear them once.
  for (const key of LEGACY_STORAGE_KEYS) {
    writeStorage('local', key, null)
  }

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

import { readStorage, writeStorage } from '../shared/storage'
