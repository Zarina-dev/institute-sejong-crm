import type { TranslateFn } from '../../app/preferences'
import { BUILTIN_COMPETITION_KINDS } from './types'
import type { Competition, CompetitionKind } from './types'

/**
 * The built-in kinds are translated — the two competitions, and the
 * occasions 행사 사진첩 used to file albums under (their wording lives in
 * gallery.tags); anything the admin added is read as typed.
 */
const BUILTIN_LABEL = {
  speech: 'competitions.speechTitle',
  writing: 'competitions.writingTitle',
  foodExperience: 'gallery.tags.foodExperience',
  opening: 'gallery.tags.opening',
  graduation: 'gallery.tags.graduation',
  folkGames: 'gallery.tags.folkGames',
  historyTour: 'gallery.tags.historyTour',
  camp: 'gallery.tags.camp',
  ska: 'gallery.tags.ska',
  topik: 'gallery.tags.topik',
  other: 'gallery.tags.other',
} as const

/** Stable colours for the built-ins; the rest cycle through a palette. */
const BUILTIN_COLOUR: Record<string, string> = {
  speech: 'blue',
  writing: 'purple',
  opening: 'green',
  graduation: 'gold',
  historyTour: 'cyan',
  topik: 'geekblue',
  ska: 'geekblue',
}
const PALETTE = ['magenta', 'volcano', 'geekblue', 'cyan', 'green', 'orange'] as const

export const competitionKindLabel = (kind: CompetitionKind, t: TranslateFn) =>
  kind in BUILTIN_LABEL ? t(BUILTIN_LABEL[kind as keyof typeof BUILTIN_LABEL]) : kind

export function competitionKindColour(kind: CompetitionKind) {
  if (BUILTIN_COLOUR[kind]) {
    return BUILTIN_COLOUR[kind]
  }

  // The same competition keeps the same colour from one visit to the next.
  const seed = [...kind].reduce((sum, letter) => sum + letter.codePointAt(0)!, 0)

  return PALETTE[seed % PALETTE.length]
}

/**
 * Every kind there is: the built-ins first, then the ones the institute
 * has added, in the order they were first held.
 */
export function competitionKinds(records: Competition[]): CompetitionKind[] {
  const added = records.map((record) => record.kind).filter((kind) => !(BUILTIN_COMPETITION_KINDS as readonly string[]).includes(kind))

  return [...BUILTIN_COMPETITION_KINDS, ...new Set(added)]
}

export const competitionKindOptions = (records: Competition[], t: TranslateFn) =>
  competitionKinds(records).map((kind) => ({ value: kind, label: competitionKindLabel(kind, t) }))

/**
 * For the public filter: only competitions there is something to show for,
 * so a visitor is never offered an empty list.
 */
export const competitionKindsInUse = (records: Competition[], t: TranslateFn) =>
  competitionKinds(records)
    .filter((kind) => records.some((record) => record.kind === kind))
    .map((kind) => ({ value: kind, label: competitionKindLabel(kind, t) }))

/** The filter's "every competition" entry; `null` cannot be a Select value. */
export const ALL_KINDS = 'all'
