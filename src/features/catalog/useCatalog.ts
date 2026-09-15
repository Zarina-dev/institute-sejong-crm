import { useSyncExternalStore } from 'react'

import { getCatalog, subscribeToCatalog, type Catalog } from './catalogStore'

const serverSnapshot: Catalog = { subjects: [], courses: [] }

/**
 * Reads the editable 과목/과정 catalog as reactive state, so every picker —
 * the admin modal, the admin filters and the public materials filters —
 * updates the moment an item is added or removed, in this tab or another.
 */
export function useCatalog(): Catalog {
  return useSyncExternalStore(subscribeToCatalog, getCatalog, () => serverSnapshot)
}
