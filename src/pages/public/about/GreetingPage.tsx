import { CalendarOutlined, GlobalOutlined, LinkOutlined, ReadOutlined } from '@ant-design/icons'
import { Typography } from 'antd'
import type { ReactNode } from 'react'

import { usePreferences, type TranslationKey } from '../../../app/preferences'
import { ContentSection } from '../../../features/content/ContentSection'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

type Fact = { icon: ReactNode; title: TranslationKey; text: TranslationKey }

/** King Sejong Institute network — sourced facts, see README "Content pages". */
const ksiFacts: Fact[] = [
  { icon: <CalendarOutlined />, title: 'about.ksi.fact1Title', text: 'about.ksi.fact1Text' },
  { icon: <GlobalOutlined />, title: 'about.ksi.fact2Title', text: 'about.ksi.fact2Text' },
  { icon: <ReadOutlined />, title: 'about.ksi.fact3Title', text: 'about.ksi.fact3Text' },
]

const KSIF_URL = 'https://www.ksif.or.kr/'

/**
 * 인사말 — the director's greeting (written by the admin) followed by the
 * sourced description of the 세종학당 network this institute belongs to.
 */
export function GreetingPage() {
  const { t } = usePreferences()

  return (
    <div className="page-layout about-page">
      <PageHeader kicker={t('siteNav.about')} title={t('pageCopy.greetingTitle')} description={t('about.copy')} />

      <ContentSection slug="about.greeting" emptyText={t('pageCopy.greetingFallback')} />

      {/* ---- 세종학당: the network this institute belongs to ---- */}
      <section className="about-section" aria-labelledby="about-ksi">
        <div className="about-section__intro">
          <Text className="section-kicker">{t('about.ksi.kicker')}</Text>
          <Title level={2} id="about-ksi">
            {t('about.ksi.title')}
          </Title>
          <Paragraph className="about-lead">{t('about.ksi.intro')}</Paragraph>
          <a className="about-link" href={KSIF_URL} target="_blank" rel="noopener noreferrer">
            <img src="/ksif-logo.svg" alt="" className="about-ksif-logo" />
            <span>
              <LinkOutlined /> {t('about.ksi.link')}
            </span>
          </a>
        </div>

        <ol className="about-facts">
          {ksiFacts.map((item) => (
            <li key={item.title}>
              <span className="about-fact-icon" aria-hidden="true">
                {item.icon}
              </span>
              <div>
                <Title level={3}>{t(item.title)}</Title>
                <Paragraph>{t(item.text)}</Paragraph>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}