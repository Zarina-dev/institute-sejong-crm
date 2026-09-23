/**
 * Administrator session.
 *
 * The site has exactly one account, so a session is just "the admin is
 * signed in, here is the API token". It lives in `sessionStorage`, so
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
export type AdminSession = {
  username: string
  /** API bearer token issued by POST /auth/login (12 h). */
  token: string
}

const STORAGE_KEY = 'institut-admin-session'
const LEGACY_STORAGE_KEYS = ['institut-demo-session', 'institut-students', 'institut-catalog']
const CHANNEL_NAME = 'institut-session'
const HANDSHAKE_TIMEOUT_MS = 300

type SessionMessage = { type: 'request' } | { type: 'session'; session: AdminSession } | { type: 'clear' }

let cachedRaw: string | null = null
let cachedSession: AdminSession | null = null
let resolving = false
const listeners = new Set<() => void>()

const channel: BroadcastChannel | null =
  typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null

function readRaw(): string | null {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(STORAGE_KEY)
}

function writeRaw(raw: string | null) {
  if (raw) {
    window.sessionStorage.setItem(STORAGE_KEY, raw)
  } else {
    window.sessionStorage.removeItem(STORAGE_KEY)
  }
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
    cachedSession = JSON.parse(raw) as AdminSession
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

/** Bearer token for API calls; undefined when signed out. */
export function getAuthToken(): string | undefined {
  return getSession()?.token
}

if (typeof window !== 'undefined') {
  // Sessions and the old localStorage stores (students, 과목/과정 catalog)
  // predate the current design; clear them once.
  for (const key of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
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
