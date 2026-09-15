import { ArrowRightOutlined, BookOutlined, CompassOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences, type TranslationKey } from '../../app/preferences'

const { Title, Paragraph, Text } = Typography

/** Institutional copy is translated content, not data — it lives in i18n. */
const values: Array<{ icon: ReactNode; title: TranslationKey; text: TranslationKey }> = [
  { icon: <CompassOutlined />, title: 'about.value1Title', text: 'about.value1Text' },
  { icon: <TeamOutlined />, title: 'about.value2Title', text: 'about.value2Text' },
  { icon: <BookOutlined />, title: 'about.value3Title', text: 'about.value3Text' },
]

/** Contact details are the same in every language. */
const contact = {
  email: 'info@institut.example',
  phone: '+996 555 123 456',
  address: '123 Education Avenue, Bishkek',
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

      <section>
        <div className="section-heading">
          <div>
            <Text className="section-kicker">{t('about.guidesKicker')}</Text>
            <Title level={2}>{t('about.guidesTitle')}</Title>
          </div>
        </div>
        <Row gutter={[18, 18]}>
          {values.map((value) => (
            <Col xs={24} md={8} key={value.title}>
              <Card className="surface-card value-card">
                <span aria-hidden="true">{value.icon}</span>
                <Title level={3}>{t(value.title)}</Title>
                <Paragraph type="secondary">{t(value.text)}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
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
