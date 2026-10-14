import type { Language } from '../i18n'

/** The site's languages other than Korean — the ones a record can be translated into. */
export const TRANSLATION_LANGUAGES = ['en', 'ru', 'ky'] as const
export type TranslationLanguage = (typeof TRANSLATION_LANGUAGES)[number]

/** `{ en: { title: '…' }, ru: { … }, ky: { … } }` — only what has been translated. */
export type Translations<Field extends string = string> = Partial<Record<TranslationLanguage, Partial<Record<Field, string>>>>

/**
 * A record's text in the reader's language: Korean from the record itself,
 * any other language from its translations — and the Korean wherever that
 * language has not been written yet, so nothing is ever blank.
 */
export function translated<Field extends string>(
  record: { translations?: Translations<Field> | null } & Partial<Record<Field, string | null | undefined>>,
  field: Field,
  language: Language,
): string {
  const korean = record[field] ?? ''
  if (language === 'ko') return korean
  return record.translations?.[language]?.[field]?.trim() || korean
}
