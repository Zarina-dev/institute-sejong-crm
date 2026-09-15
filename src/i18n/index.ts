import { en, type Dictionary } from './en'

export type Language = 'en' | 'ru' | 'ko' | 'ky'

export const languages: ReadonlyArray<{ value: Language; label: string; title: string }> = [
  { value: 'en', label: 'EN', title: 'English' },
  { value: 'ru', label: 'RU', title: 'Русский' },
  { value: 'ko', label: 'KO', title: '한국어' },
  { value: 'ky', label: 'KY', title: 'Кыргызча' },
]

export function isLanguage(value: unknown): value is Language {
  return languages.some((item) => item.value === value)
}

/* ------------------------------------------------------------------------ */
/* Types                                                                     */
/* ------------------------------------------------------------------------ */

/** Base names of plural groups in a level: `count_one` → `count`. */
type PluralBases<T> = { [K in keyof T & string]: K extends `${infer B}_one` ? B : never }[keyof T & string]

/**
 * Shape every non-English locale must satisfy: the same tree as `en` with
 * plain strings at the leaves. Of each plural group only `_other` is
 * required — Korean has a single form, Russian/Kyrgyz add `_one`/`_few`/`_many`.
 */
export type Localized<T> = {
  [K in keyof T as K extends `${string}_one` ? never : K]: T[K] extends string ? string : Localized<T[K]>
} & { [B in PluralBases<T> as `${B}_one` | `${B}_few` | `${B}_many`]?: string }

export type LocaleDictionary = Localized<Dictionary>

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>
}[keyof T & string]

/** `materials.count_one` and `materials.count_other` collapse to `materials.count`. */
type StripPlural<K extends string> = K extends `${infer Base}_one` | `${infer Base}_other` ? Base : K

/** Every key `t()` accepts — e.g. `'nav.home'`, `'materials.count'`. */
export type TranslationKey = StripPlural<Leaves<Dictionary>>

export type TranslateParams = Record<string, string | number> & { count?: number }

/* ------------------------------------------------------------------------ */
/* Runtime                                                                   */
/* ------------------------------------------------------------------------ */

const pluralRules = new Map<Language, Intl.PluralRules>()

function pluralCategory(language: Language, count: number) {
  let rules = pluralRules.get(language)

  if (!rules) {
    rules = new Intl.PluralRules(language === 'ky' ? 'ky' : language)
    pluralRules.set(language, rules)
  }

  return rules.select(count)
}

function lookup(dictionary: object, path: string): string | undefined {
  let node: unknown = dictionary

  for (const segment of path.split('.')) {
    if (node === null || typeof node !== 'object' || !(segment in node)) {
      return undefined
    }

    node = (node as Record<string, unknown>)[segment]
  }

  return typeof node === 'string' ? node : undefined
}

function interpolate(template: string, params?: TranslateParams) {
  if (!params) {
    return template
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{{${name}}}`,
  )
}

/**
 * Resolves a key in `dictionary`, falling back to English so a locale that
 * lags behind still renders text rather than a blank. With `count`, tries
 * the CLDR plural form for the language first, then `_other`.
 */
export function translate(
  language: Language,
  dictionary: LocaleDictionary,
  key: TranslationKey,
  params?: TranslateParams,
): string {
  const candidates: string[] = []

  if (params && typeof params.count === 'number') {
    candidates.push(`${key}_${pluralCategory(language, params.count)}`, `${key}_other`)
  }

  candidates.push(key)

  for (const candidate of candidates) {
    const value = lookup(dictionary, candidate) ?? lookup(en, candidate)

    if (value !== undefined) {
      return interpolate(value, params)
    }
  }

  if (import.meta.env.DEV) {
    console.warn(`[i18n] missing key: ${key}`)
  }

  return key
}

/* ------------------------------------------------------------------------ */
/* Lazy locale loading                                                       */
/* ------------------------------------------------------------------------ */

const loaders: Record<Exclude<Language, 'en'>, () => Promise<{ default: LocaleDictionary }>> = {
  ru: () => import('./ru'),
  ko: () => import('./ko'),
  ky: () => import('./ky'),
}

const cache = new Map<Language, LocaleDictionary>([['en', en as unknown as LocaleDictionary]])

/** Already-loaded dictionary, or `undefined` while its chunk is in flight. */
export function getLoadedDictionary(language: Language) {
  return cache.get(language)
}

export async function loadDictionary(language: Language): Promise<LocaleDictionary> {
  const loaded = cache.get(language)

  if (loaded) {
    return loaded
  }

  const module = await loaders[language as Exclude<Language, 'en'>]()
  cache.set(language, module.default)
  return module.default
}

export { en }
export type { Dictionary }
