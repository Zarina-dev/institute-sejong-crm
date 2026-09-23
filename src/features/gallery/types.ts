export const EVENT_TAGS = [
  'speechContest',
  'writingContest',
  'foodExperience',
  'opening',
  'graduation',
  'folkGames',
  'historyTour',
  'camp',
  'ska',
  'topik',
  'other',
] as const

export type EventTag = (typeof EVENT_TAGS)[number]

export type GalleryAlbum = {
  id: string
  year: number
  title: string
  eventTag: EventTag
  description: string
  /** Google Photos album link (high-resolution photos live there, not on our server). */
  albumUrl: string | null
  coverImage: string | null
  heldOn: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type AlbumInput = {
  year: number
  title: string
  eventTag?: EventTag
  description?: string
  albumUrl?: string | null
  coverImage?: string | null
  heldOn?: string | null
  isPublished?: boolean
}