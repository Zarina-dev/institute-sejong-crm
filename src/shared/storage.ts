/**
 * Browser storage that never throws. With site data blocked (a privacy
 * setting, some embedded browsers) merely touching `localStorage` raises;
 * the site then runs on its defaults instead of failing to start.
 */
type Store = 'local' | 'session'

const storeOf = (store: Store): Storage | null => {
  try {
    return store === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readStorage(store: Store, key: string): string | null {
  try {
    return storeOf(store)?.getItem(key) ?? null
  } catch {
    return null
  }
}

/** Stores `value`, or removes the key when it is null. */
export function writeStorage(store: Store, key: string, value: string | null) {
  try {
    const target = storeOf(store)
    if (value === null) {
      target?.removeItem(key)
    } else {
      target?.setItem(key, value)
    }
  } catch {
    // Nothing to keep it in; the value lasts as long as the page.
  }
}
