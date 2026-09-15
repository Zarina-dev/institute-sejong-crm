import { ArrowRightOutlined, BookOutlined, CalendarOutlined, GlobalOutlined, LinkOutlined, ReadOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences, type TranslationKey } from '../../app/preferences'

const { Title, Paragraph, Text } = Typography

type Fact = { icon: ReactNode; title: TranslationKey; text: TranslationKey }

/** King Sejong Institute network — sourced facts, see README "Content pages". */
const ksiFacts: Fact[] = [
  { icon: <CalendarOutlined />, title: 'about.ksi.fact1Title', text: 'about.ksi.fact1Text' },
  { icon: <GlobalOutlined />, title: 'about.ksi.fact2Title', text: 'about.ksi.fact2Text' },
  { icon: <ReadOutlined />, title: 'about.ksi.fact3Title', text: 'about.ksi.fact3Text' },
]

/** Osh 1 — placeholder copy until the institute supplies its own. */
const oshItems: Fact[] = [
  { icon: <BookOutlined />, title: 'about.osh.item1Title', text: 'about.osh.item1Text' },
  { icon: <TrophyOutlined />, title: 'about.osh.item2Title', text: 'about.osh.item2Text' },
  { icon: <TeamOutlined />, title: 'about.osh.item3Title', text: 'about.osh.item3Text' },
]

const KSIF_URL = 'https://www.ksif.or.kr/'

/** Contact details are the same in every language. Demo values. */
const contact = {
  email: 'osh1@ksi.example',
  phone: '+996 3222 00 000',
  address: 'Osh, Kyrgyzstan',
}

function FactGrid({ items, t }: { items: Fact[]; t: (key: TranslationKey) => string }) {
  return (
    <Row gutter={[18, 18]}>
      {items.map((item) => (
        <Col xs={24} md={8} key={item.title}>
          <Card className="surface-card value-card">
            <span aria-hidden="true">{item.icon}</span>
            <Title level={3}>{t(item.title)}</Title>
            <Paragraph type="secondary">{t(item.text)}</Paragraph>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export function AboutPage() {
  const { t } = usePreferences()

  return (
    <div className="page-layout about-page">
      <header className="about-hero">
        <Tag>{t('about.kicker')}</Tag>
        <Title level={1}>{t('about.title')}</Title>
        <Paragraph>{t('about.copy')}</Paragraph>
        <Link to="/schedule">
          <Button type="primary" size="large" icon={<ArrowRightOutlined />} iconPosition="end">
            {t('about.cta')}
          </Button>
        </Link>
      </header>

      {/* ---- 세종학당: the network this institute belongs to ---- */}
      <section className="about-block">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">{t('about.ksi.kicker')}</Text>
            <Title level={2}>{t('about.ksi.title')}</Title>
          </div>
          <img src="/ksif-logo.svg" alt="King Sejong Institute Foundation" className="about-ksif-logo" />
        </div>
        <Paragraph className="about-intro">{t('about.ksi.intro')}</Paragraph>
        <FactGrid items={ksiFacts} t={t} />
        <a className="about-link" href={KSIF_URL} target="_blank" rel="noopener noreferrer">
          <LinkOutlined /> {t('about.ksi.link')}
        </a>
      </section>

      {/* ---- 오시 1 세종학당: this institute ---- */}
      <section className="about-block">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">{t('about.osh.kicker')}</Text>
            <Title level={2}>{t('about.osh.title')}</Title>
          </div>
        </div>
        <Paragraph className="about-intro">{t('about.osh.intro')}</Paragraph>
        <FactGrid items={oshItems} t={t} />
      </section>

      <Card className="surface-card contact-card">
        <div>
          <Text className="section-kicker">{t('about.contactKicker')}</Text>
          <Title level={2}>{t('about.contactTitle')}</Title>
          <Paragraph type="secondary">{t('about.contactCopy')}</Paragraph>
        </div>
        <div className="contact-details">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={`tel:${contact.phone.replace(/\s+/g, '')}`}>{contact.phone}</a>
          <Text type="secondary">{contact.address}</Text>
        </div>
      </Card>
    </div>
  )
}
