import {
  ArrowRightOutlined,
  BookOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  InstagramOutlined,
  LinkOutlined,
  MailOutlined,
  PhoneOutlined,
  ReadOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Card, Col, Empty, Row, Skeleton, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { assetUrl } from '../../api/client'
import { contact, phoneHref } from '../../app/contact'
import { usePreferences, type TranslationKey } from '../../app/preferences'
import { usePublishedStaff } from '../../features/staff/queries'
import type { StaffMember } from '../../features/staff/types'
import { ErrorAlert } from '../../shared/ErrorAlert'

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

const NO_STAFF: StaffMember[] = []

/**
 * Facts as a numbered list rather than three floating cards: one column of
 * generous text is far easier to read than three narrow ones, and the icon
 * column gives the eye an anchor per item.
 */
function FactList({ items, t }: { items: Fact[]; t: (key: TranslationKey) => string }) {
  return (
    <ol className="about-facts">
      {items.map((item) => (
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
  )
}

function StaffCard({ member }: { member: StaffMember }) {
  return (
    <Card className="surface-card staff-card">
      <Avatar size={112} src={member.photoUrl ? assetUrl(member.photoUrl) : undefined} icon={<UserOutlined />} alt="" />
      <Title level={3}>{member.name}</Title>
      <Text className="staff-card__position">{member.position}</Text>
      {member.bio ? <Paragraph className="staff-card__bio">{member.bio}</Paragraph> : null}
      {member.email ? (
        <a className="staff-card__email" href={`mailto:${member.email}`}>
          <MailOutlined /> {member.email}
        </a>
      ) : null}
    </Card>
  )
}

export function AboutPage() {
  const { t } = usePreferences()
  const staff = usePublishedStaff()
  const members = staff.data ?? NO_STAFF

  return (
    <div className="page-layout about-page">
      <header className="about-hero">
        <div className="about-hero__copy">
          <Tag>{t('about.kicker')}</Tag>
          <Title level={1}>{t('about.title')}</Title>
          <Paragraph>{t('about.copy')}</Paragraph>
          <Link to="/schedule">
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} iconPosition="end">
              {t('about.cta')}
            </Button>
          </Link>
        </div>
        <img src="/ksi-symbol.svg" alt="" className="about-hero__symbol" aria-hidden="true" />
      </header>

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
        <FactList items={ksiFacts} t={t} />
      </section>

      {/* ---- 오시 1 세종학당: this institute ---- */}
      <section className="about-section about-section--accent" aria-labelledby="about-osh">
        <div className="about-section__intro">
          <Text className="section-kicker">{t('about.osh.kicker')}</Text>
          <Title level={2} id="about-osh">
            {t('about.osh.title')}
          </Title>
          <Paragraph className="about-lead">{t('about.osh.intro')}</Paragraph>
        </div>
        <FactList items={oshItems} t={t} />
      </section>

      {/* ---- 교직원: managed from /admin/staff ---- */}
      <section className="about-staff" aria-labelledby="about-staff">
        <div className="section-heading">
          <div>
            <Text className="section-kicker">{t('about.staffKicker')}</Text>
            <Title level={2} id="about-staff">
              {t('about.staffTitle')}
            </Title>
          </div>
        </div>
        <Paragraph className="about-lead">{t('about.staffIntro')}</Paragraph>

        <ErrorAlert error={staff.error} fallback={t('staff.loadFailed')} />

        {staff.isPending ? (
          <Row gutter={[18, 18]}>
            {Array.from({ length: 3 }, (_, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card className="surface-card staff-card">
                  <Skeleton active avatar={{ size: 112, shape: 'circle' }} paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : members.length > 0 ? (
          <Row gutter={[18, 18]}>
            {members.map((member) => (
              <Col xs={24} sm={12} lg={8} key={member.id}>
                <StaffCard member={member} />
              </Col>
            ))}
          </Row>
        ) : staff.error ? null : (
          <Card className="surface-card empty-card">
            <Empty description={t('about.staffEmpty')} />
          </Card>
        )}
      </section>

      <Card className="surface-card contact-card">
        <div>
          <Text className="section-kicker">{t('about.contactKicker')}</Text>
          <Title level={2}>{t('about.contactTitle')}</Title>
          <Paragraph>{t('about.contactCopy')}</Paragraph>
        </div>
        <div className="contact-details">
          <Text>
            <EnvironmentOutlined /> {contact.address}
          </Text>
          <a href={phoneHref}>
            <PhoneOutlined /> {contact.phone}
          </a>
          <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
            <InstagramOutlined /> {contact.instagramHandle}
          </a>
        </div>
      </Card>
    </div>
  )
}
