/**
 * Text as a search compares it: lower case, no spaces, one Unicode form —
 * so "임 연식" finds 임연식 and "АЙДА" finds Айда.
 */
const normalise = (value: string) => value.normalize('NFC').toLowerCase().replace(/\s+/g, '')

/** Whether any of a record's texts contains the query (an empty query matches all). */
export function matchesQuery(query: string, texts: Array<string | number | null | undefined>) {
  const wanted = normalise(query)
  return !wanted || texts.some((text) => text != null && normalise(String(text)).includes(wanted))
}
