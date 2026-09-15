import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  en,
  getLoadedDictionary,
  isLanguage,
  languages,
  loadDictionary,
  translate,
  type Language,
  type LocaleDictionary,
  type TranslateParams,
  type TranslationKey,
} from '../i18n'

export type { Language, TranslationKey }
export { languages }
export type ThemeMode = 'light' | 'dark'

const LANGUAGE_STORAGE_KEY = 'institut-language'
const THEME_STORAGE_KEY = 'institut-theme'

function readLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)

  if (isLanguage(stored)) {
    return stored
  }

  const browserLanguage = navigator.language.slice(0, 2).toLowerCase()
  return isLanguage(browserLanguage) ? browserLanguage : 'en'
}

function readTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export type TranslateFn = (key: TranslationKey, params?: TranslateParams) => string

type Preferences = {
  language: Language
  /** `true` while a non-English dictionary chunk is still downloading. */
  languageLoading: boolean
  theme: ThemeMode
  setLanguage: (value: Language) => void
  toggleTheme: () => void
  t: TranslateFn
}

const PreferencesContext = createContext<Preferences | null>(null)

/**
 * Theme + language for the whole app.
 *
 * English is bundled; the other dictionaries are separate chunks loaded on
 * demand. While one is in flight the previous dictionary keeps rendering
 * (English on first load), so switching language never flashes empty labels.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readLanguage)
  const [theme, setTheme] = useState<ThemeMode>(readTheme)
  const [dictionary, setDictionary] = useState<LocaleDictionary>(
    () => getLoadedDictionary(readLanguage()) ?? (en as unknown as LocaleDictionary),
  )
  const [loadedFor, setLoadedFor] = useState<Language>(() =>
    getLoadedDictionary(readLanguage()) ? readLanguage() : 'en',
  )

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language

    let cancelled = false

    loadDictionary(language).then((loaded) => {
      if (!cancelled) {
        setDictionary(loaded)
        setLoadedFor(language)
      }
    })

    return () => {
      cancelled = true
    }
  }, [language])

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0d1420' : '#ffffff')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const setLanguage = useCallback((value: Language) => setLanguageState(value), [])

  const t = useCallback<TranslateFn>(
    (key, params) => translate(loadedFor, dictionary, key, params),
    [dictionary, loadedFor],
  )

  const value = useMemo<Preferences>(
    () => ({ language, languageLoading: loadedFor !== language, theme, setLanguage, toggleTheme, t }),
    [language, loadedFor, theme, setLanguage, toggleTheme, t],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const context = useContext(PreferencesContext)

  if (!context) {
    throw new Error('usePreferences must be used inside a <PreferencesProvider>')
  }

  return context
}

/** Alias for readers who look for the usual name. */
export const useI18n = usePreferences
