import type { TranslateFn, TranslationKey } from '../../app/preferences'
import type { AuditChange, AuditEntry } from './api'

/** The site's languages by their own names, as a translation summary lists them. */
const LANGUAGE_NAME: Record<string, string> = { en: 'English', ru: 'Русский', ky: 'Кыргызча', ko: '한국어' }

/** A field as the admin's own forms name it: 제목, 장소, 수상자 … — the raw name only for one not listed. */
export function fieldLabel(field: string, t: TranslateFn): string {
  const label = (name: string) => {
    const key = `audit.fields.${name}` as TranslationKey
    const text = t(key)
    return text === key ? null : text
  }
  const direct = label(field)
  if (direct) return direct
  // nameKy, titleRu …: the field, in that language.
  const language = /^(.+)(Ky|Ru|En)$/.exec(field)
  if (language) {
    const base = label(language[1])
    const code = { Ky: 'ky', Ru: 'ru', En: 'en' }[language[2] as 'Ky' | 'Ru' | 'En']
    if (base) return `${base} (${LANGUAGE_NAME[code]})`
  }
  return field
}

const empty = (t: TranslateFn) => t('audit.emptyValue')

/** "공개 → 비공개", "제목: A → B", "사진: 3 → 5", "번역: English (제목, 요약)". */
export function describeChange(change: AuditChange, t: TranslateFn): { label: string; from?: string; to?: string; note?: string } {
  const label = fieldLabel(change.field, t)

  switch (change.kind) {
    case 'bool': {
      if (change.field === 'isPublished') {
        const state = (value?: string | null) => (value === 'true' ? t('common.published') : t('common.unpublished'))
        return { label, from: state(change.from), to: state(change.to) }
      }
      const yes = (value?: string | null) => (value === 'true' ? t('audit.yes') : t('audit.no'))
      return { label, from: yes(change.from), to: yes(change.to) }
    }
    case 'count':
      return { label, from: change.from ?? '0', to: change.to ?? '0' }
    case 'translations': {
      const parts = (change.to ?? '')
        .split(';')
        .filter(Boolean)
        .map((part) => {
          const [language, fields] = part.split(':')
          return `${LANGUAGE_NAME[language] ?? language} (${fields
            .split(',')
            .map((field) => fieldLabel(field, t))
            .join(', ')})`
        })
      return { label, note: parts.join(' · ') }
    }
    case 'text':
      return { label, from: change.from || empty(t), to: change.to || empty(t) }
    default:
      return { label, note: t('audit.edited') }
  }
}

/** Entries written before values were kept hold only field names. */
const asChange = (item: AuditChange | string): AuditChange => (typeof item === 'string' ? { field: item, kind: 'changed' } : item)

export const entryChanges = (entry: AuditEntry) => entry.changes.map(asChange)

/** One line for the table: the first change, and how many more. */
export function changeHeadline(entry: AuditEntry, t: TranslateFn): string {
  const changes = entryChanges(entry)
  if (changes.length === 0) return ''
  const first = describeChange(changes[0], t)
  const text = first.note ? `${first.label}: ${first.note}` : `${first.label}: ${first.from} → ${first.to}`
  return changes.length > 1 ? `${text} ${t('audit.andMore', { count: changes.length - 1 })}` : text
}
