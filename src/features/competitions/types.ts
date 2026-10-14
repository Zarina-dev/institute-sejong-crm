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
  // Kinds the institute's 10th-anniversary book needed.
  'culture',
  'kpop',
  'quiz',
  'olympiad',
  'awards',
  'other',
] as const
export type CompetitionKind = string

/** One line of the results table. */
export type CompetitionWinner = {
  rank: number
  name: string
  note?: string | null
  /** The name (in Cyrillic or Latin) and note in the other languages. */
  translations?: Translations<'name' | 'note'>
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
  /** Title, venue and summary (HTML) in English, Russian and Kyrgyz. */
  translations?: Translations<'title' | 'venue' | 'summary'>
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
  translations?: Translations<'title' | 'venue' | 'summary'>
}

import type { Translations } from '../../shared/translations'
