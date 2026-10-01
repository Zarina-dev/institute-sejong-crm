/**
 * 말하기 대회 · 백일장 — the two the institute has always run, kept as codes
 * because the site translates them. A competition added later is stored
 * under the name the admin gives it, so a kind is just a string.
 */
export const BUILTIN_COMPETITION_KINDS = ['speech', 'writing'] as const
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
