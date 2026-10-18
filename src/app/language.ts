import { isLanguage, type Language } from '../i18n'
import { readStorage } from '../shared/storage'

export const LANGUAGE_STORAGE_KEY = 'institut-language'

/** The language the app starts in: the visitor's choice, else the browser's, else English. */
export function readLanguage(): Language {
  const stored = readStorage('local', LANGUAGE_STORAGE_KEY)

  if (isLanguage(stored)) {
    return stored
  }

  const browserLanguage = navigator.language.slice(0, 2).toLowerCase()
  return isLanguage(browserLanguage) ? browserLanguage : 'en'
}
