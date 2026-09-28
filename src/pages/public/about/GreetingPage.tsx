import { ArrowRightOutlined, EnvironmentOutlined, LinkOutlined, PhoneOutlined } from '@ant-design/icons'
import { Button, Card, Skeleton, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { contact, phoneHref } from '../../../app/contact'
import { usePreferences, type TranslationKey } from '../../../app/preferences'
import { ChronologyTimeline } from '../../../features/chronology/ChronologyTimeline'
import { useChronology } from '../../../features/chronology/queries'
import type { ChronologyEntry } from '../../../features/chronology/types'
import { ContentSection } from '../../../features/content/ContentSection'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

const NO_ENTRIES: ChronologyEntry[] = []

/** The network's own site; the details of 세종학당 live there, not here. */
const KSIF_URL = 'https://www.ksif.or.kr/'

/** 세종학당 in three figures — the network at a glance. */
const NETWORK_STATS: Array<{ value: TranslationKey; label: TranslationKey }> = [
  { value: 'about.ksi.stat1Value', label: 'about.ksi.stat1Label' },
  { value: 'about.ksi.stat2Value', label: 'about.ksi.stat2Label' },
  { value: 'about.ksi.stat3Value', label: 'about.ksi.stat3Label' },
]

/** What this institute offers — the part visitors actually came for. */
const OSH_ITEMS: Array<{ title: TranslationKey; text: TranslationKey }> = [
  { title: 'about.osh.item1Title', text: 'about.osh.item1Text' },
  { title: 'about.osh.item2Title', text: 'about.osh.item2Text' },
  { title: 'about.osh.item3Title', text: 'about.osh.item3Text' },
]

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="about-section" aria-labelledby={id}>
      <div className="about-section__head">
        <Text className="section-kicker">{kicker}</Text>
        <Title level={2} id={id}>
          {title}
        </Title>
      </div>
      {children}
    </section>
  )
}

/**
 * 학당 소개 — the director's greeting, then two unequal halves on purpose:
 * 세종학당 is summarised in a paragraph and three figures with a link to the
 * Foundation's own site, while 오시 1 세종학당 — the thing a visitor came for
 * — is described in full and closed by the institute's 연혁.
 */
export function GreetingPage() {
  const { t } = usePreferences()
  const chronology = useChronology()

  // The About page shows the turning points; the full list has its own page.
  const milestones = (chronology.data ?? NO_ENTRIES).filter((entry) => entry.isMilestone)
  const timeline = milestones.length > 0 ? milestones : (chronology.data ?? NO_ENTRIES).slice(0, 6)

  return (
    <div className="page-layout about-page">
      <PageHeader kicker={t('siteNav.about')} title={t('pageCopy.greetingTitle')} description={t('about.copy')} />

      <ContentSection slug="about.greeting" emptyText={t('pageCopy.greetingFallback')} />

      {/* ---- 세종학당: the network, in brief. Details live on its own site. ---- */}
      <Section id="about-ksi" kicker={t('about.ksi.kicker')} title={t('about.ksi.title')}>
        <Card className="surface-card network-card">
          <Paragraph className="about-lead">{t('about.ksi.intro')}</Paragraph>

          <ul className="network-stats">
            {NETWORK_STATS.map((stat) => (
              <li key={stat.value}>
                <strong>{t(stat.value)}</strong>
                <Text type="secondary">{t(stat.label)}</Text>
              </li>
            ))}
          </ul>

          <a className="about-link" href={KSIF_URL} target="_blank" rel="noopener noreferrer">
            <img src="/ksif-logo.svg" alt="" className="about-ksif-logo" />
            <span>
              <LinkOutlined /> {t('about.ksi.link')}
            </span>
          </a>
        </Card>
      </Section>

      {/* ---- 오시 1 세종학당: the part this site is actually about ---- */}
      <Section id="about-osh" kicker={t('about.osh.kicker')} title={t('about.osh.title')}>
        <Paragraph className="about-lead">{t('about.osh.intro')}</Paragraph>
        <Paragraph className="about-body">{t('about.osh.detail')}</Paragraph>

        <ol className="about-offer">
          {OSH_ITEMS.map((item) => (
            <li key={item.title}>
              <Title level={3}>{t(item.title)}</Title>
              <Paragraph>{t(item.text)}</Paragraph>
            </li>
          ))}
        </ol>

        <Card className="surface-card portal-callout">
          <div>
            <Text strong>{t('about.osh.visitTitle')}</Text>
            <Text type="secondary">
              <EnvironmentOutlined /> {contact.address}
            </Text>
          </div>
          <div className="portal-callout__actions">
            <a href={phoneHref}>
              <Button type="primary" icon={<PhoneOutlined />}>
                {contact.phone}
              </Button>
            </a>
            <Link to="/programmes">
              <Button icon={<ArrowRightOutlined />} iconPosition="end">
                {t('about.osh.coursesLink')}
              </Button>
            </Link>
          </div>
        </Card>
      </Section>

      {/* ---- 연혁: the milestones, with the full list one click away ---- */}
      <Section id="about-chronology" kicker={t('chronology.title')} title={t('about.chronologyTitle')}>
        {chronology.isPending ? (
          <Card className="surface-card">
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        ) : timeline.length > 0 ? (
          <Card className="surface-card chronology-card">
            <ChronologyTimeline entries={timeline} compact />

            <Link className="about-more" to="/about/chronology">
              {t('about.chronologyLink')} <ArrowRightOutlined />
            </Link>
          </Card>
        ) : null}
      </Section>
    </div>
  )
}
