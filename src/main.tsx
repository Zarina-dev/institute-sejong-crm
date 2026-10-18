import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider } from 'antd'
import type { Locale } from 'antd/es/locale'
import enUS from 'antd/locale/en_US'

import { AppRouter } from './app/router'
import { readLanguage } from './app/language'
import { PreferencesProvider, usePreferences, type Language } from './app/preferences'
import { queryClient } from './app/queryClient'
import { getAntdTheme } from './app/theme'
import { loadDictionary } from './i18n'
import './styles/index.css'

/**
 * Ant Design's own strings (date pickers, pagination, empty states). English
 * comes with the app; the others are small chunks loaded with the language.
 * There is no Kyrgyz bundle; Russian is the closest available.
 */
const antdLocales: Record<Language, () => Promise<Locale>> = {
  en: () => Promise.resolve(enUS),
  ru: () => import('antd/locale/ru_RU').then((m) => m.default),
  ko: () => import('antd/locale/ko_KR').then((m) => m.default),
  ky: () => import('antd/locale/ru_RU').then((m) => m.default),
}
const loadedLocales = new Map<Language, Locale>([['en', enUS]])
const loadAntdLocale = (language: Language) =>
  antdLocales[language]().then((locale) => {
    loadedLocales.set(language, locale)
    return locale
  })

function ThemedApp() {
  const { theme, language } = usePreferences()
  const [locale, setLocale] = useState<Locale>(() => loadedLocales.get(language) ?? enUS)

  useEffect(() => {
    let cancelled = false
    void loadAntdLocale(language).then((loaded) => !cancelled && setLocale(loaded))
    return () => {
      cancelled = true
    }
  }, [language])

  return (
    <ConfigProvider theme={getAntdTheme(theme)} locale={locale}>
      {/* AntdApp provides the message/modal/notification context that hooks
          such as App.useApp() need, and scopes AntD's reset styles. */}
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  )
}

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element #root was not found in index.html')
}

const render = () =>
  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PreferencesProvider>
            <ThemedApp />
          </PreferencesProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )

/**
 * The visitor's language is in place before the first render: rendering in
 * English and then again once the dictionary arrived showed English text
 * for a moment and drew the whole page twice. Both files are small (~15 kB);
 * a slow one does not keep the page blank for more than a moment.
 */
const language = readLanguage()
const ready = Promise.all([loadDictionary(language), loadAntdLocale(language)]).catch(() => {})
void Promise.race([ready, new Promise((resolve) => setTimeout(resolve, 1500))]).then(render)
