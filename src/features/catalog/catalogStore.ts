/**
 * Editable catalog of 과목 (subject) and 과정 (course) values.
 *
 * The API stores `subject` and `course` on a material as free-form
 * `varchar(120)` (see backend LearningMaterial), so these lists are only a
 * suggestion set for the pickers — there is no server endpoint to manage them.
 * They are therefore persisted in localStorage, the same way the demo student
 * records already are. Moving them to the API later means swapping the four
 * functions below; the `useCatalog()` consumers stay unchanged.
 */

export type CatalogKind = 'subjects' | 'courses'
export type CatalogOption = { value: string; label: string }
export type Catalog = Record<CatalogKind, CatalogOption[]>

const STORAGE_KEY = 'institut-catalog'

const defaults: Record<CatalogKind, string[]> = {
  subjects: ['한국어', '수학', '물리학', '문학'],
  courses: ['한국어 1', '한국어 2', '수학 기초', '문학 기초'],
}

export const MAX_CATALOG_ITEM_LENGTH = 120

type StoredCatalog = Record<CatalogKind, string[]>

/* --------------------------------------------------------------------------
   Snapshot cache

   `getCatalog()` is read during render through useSyncExternalStore, so an
   unchanged catalog has to return the very same object — otherwise React
   would see a new snapshot every pass and re-render forever.
   -------------------------------------------------------------------------- */

let cachedRaw: string | null = null
let cachedCatalog: Catalog | null = null
const listeners = new Set<() => void>()

function toOptions(values: string[]): CatalogOption[] {
  return values.map((value) => ({ value, label: value }))
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function parse(raw: string | null): StoredCatalog {
  if (!raw) {
    return { ...defaults }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredCatalog>

    return {
      subjects: isStringArray(parsed.subjects) ? parsed.subjects : defaults.subjects,
      courses: isStringArray(parsed.courses) ? parsed.courses : defaults.courses,
    }
  } catch {
    return { ...defaults }
  }
}

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

export function getCatalog(): Catalog {
  const raw = readRaw()

  if (raw === cachedRaw && cachedCatalog) {
    return cachedCatalog
  }

  const stored = parse(raw)
  cachedRaw = raw
  cachedCatalog = {
    subjects: toOptions(stored.subjects),
    courses: toOptions(stored.courses),
  }

  return cachedCatalog
}

export function subscribeToCatalog(listener: () => void): () => void {
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

function write(next: StoredCatalog) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notify()
}

export type AddResult = { ok: true } | { ok: false; reason: 'empty' | 'duplicate' | 'tooLong' }

export function addCatalogItem(kind: CatalogKind, rawValue: string): AddResult {
  const value = rawValue.trim()

  if (!value) {
    return { ok: false, reason: 'empty' }
  }

  if (value.length > MAX_CATALOG_ITEM_LENGTH) {
    return { ok: false, reason: 'tooLong' }
  }

  const stored = parse(readRaw())

  // Case-insensitive so "한국어 1" and "한국어 1 " / differing case cannot both
  // exist and confuse the filters.
  if (stored[kind].some((item) => item.toLowerCase() === value.toLowerCase())) {
    return { ok: false, reason: 'duplicate' }
  }

  write({ ...stored, [kind]: [...stored[kind], value] })

  return { ok: true }
}

export function removeCatalogItem(kind: CatalogKind, value: string) {
  const stored = parse(readRaw())

  write({ ...stored, [kind]: stored[kind].filter((item) => item !== value) })
}
