import { apiDelete, apiGet, apiPost } from '../../api/client'

/** The record types the admin can delete — the server's trash registry. */
export const TRASH_TYPES = [
  'courses',
  'news',
  'events',
  'competitions',
  'studies',
  'staff',
  'textbooks',
  'materials',
  'meetings',
  'chronology',
  'terms',
] as const
export type TrashType = (typeof TRASH_TYPES)[number]

export type TrashItem = {
  type: TrashType
  id: string
  /** The record's own name — title, person, date… */
  label: string
  /** A second line where the name alone is ambiguous: year, position, file… */
  detail: string | null
  deletedAt: string
  /** When it is removed for good unless restored first. */
  purgeAt: string
}

export const getTrash = () => apiGet<TrashItem[]>('/trash')
export const restoreTrashItem = (item: Pick<TrashItem, 'type' | 'id'>) =>
  apiPost<{ success: boolean }>(`/trash/${item.type}/${item.id}/restore`)
export const purgeTrashItem = (item: Pick<TrashItem, 'type' | 'id'>) => apiDelete<{ success: boolean }>(`/trash/${item.type}/${item.id}`)
