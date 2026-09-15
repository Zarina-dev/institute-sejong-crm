import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import koKR from 'antd/locale/ko_KR'
import ruRU from 'antd/locale/ru_RU'

import { AppRouter } from './app/router'
import { PreferencesProvider, usePreferences, type Language } from './app/preferences'
import { getAntdTheme } from './app/theme'
import './styles/index.css'

/** Ant Design ships no Kyrgyz bundle; Russian is the closest available. */
const antdLocales: Record<Language, typeof enUS> = {
  en: enUS,
  ru: ruRU,
  ko: koKR,
  ky: ruRU,
}

function ThemedApp() {
  const { theme, language } = usePreferences()

  return (
    <ConfigProvider theme={getAntdTheme(theme)} locale={antdLocales[language]}>
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

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <ThemedApp />
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>,
)
