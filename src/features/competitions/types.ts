/**
 * The kinds of event the institute has always had, kept as codes because the
 * site translates them. A kind added later is stored under the name the
 * admin gives it, so a kind is just a string.
 */
export const BUILTIN_COMPETITION_KINDS = [
  'speech',
  'writing',
  // The occasions 행사 사진첩 used to file albums under; since 행사 사진첩 and
  // 대회 기록 became one record, a "competition" is any event.
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
export type CompetitionKind = string

/** One line of the results table. */
export type CompetitionWinner = {
  rank: number
  name: string
  note?: string | null
}

export type Competition = {
  id: string
  kind: CompetitionKind
  title: string
  year: number
  heldOn: string | null
  venue: string
  participants: number | null
  /** Sanitized HTML from the rich-text editor. */
  summary: string
  winners: CompetitionWinner[]
  coverImage: string | null
  /** The rest of the photos from that day, in display order. */
  images: string[]
  albumUrl: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type CompetitionInput = {
  kind: CompetitionKind
  title: string
  year: number
  heldOn?: string | null
  venue?: string
  participants?: number | null
  summary?: string
  winners?: CompetitionWinner[]
  coverImage?: string | null
  images?: string[]
  albumUrl?: string | null
  isPublished?: boolean
}
