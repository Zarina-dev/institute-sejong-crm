import { EnvironmentOutlined, InstagramOutlined, PhoneOutlined } from '@ant-design/icons'
import { Card, Typography } from 'antd'

import { contact, phoneHref } from '../../../app/contact'
import { usePreferences } from '../../../app/preferences'
import { ContentSection } from '../../../features/content/ContentSection'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

/** Google Maps embed needs no API key in `place` mode with a plain query. */
const MAP_QUERY = encodeURIComponent(`${contact.address}, Osh, Kyrgyzstan`)
const MAP_EMBED = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`

/** 오시는 길 — address, contacts and the map. */
export function LocationPage() {
  const { t } = usePreferences()

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.about')} title={t('pageCopy.locationTitle')} description={t('pageCopy.locationFallback')} />

      <div className="location-layout">
        <Card className="surface-card location-facts">
          <dl>
            <div>
              <dt>
                <EnvironmentOutlined /> {t('pageCopy.address')}
              </dt>
              <dd>{contact.address}</dd>
            </div>
            <div>
              <dt>
                <PhoneOutlined /> {t('pageCopy.phone')}
              </dt>
              <dd>
                <a href={phoneHref}>{contact.phone}</a>
              </dd>
            </div>
            <div>
              <dt>
                <InstagramOutlined /> {t('pageCopy.instagram')}
              </dt>
              <dd>
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                  {contact.instagramHandle}
                </a>
              </dd>
            </div>
          </dl>
          <a className="about-link" href={MAP_LINK} target="_blank" rel="noopener noreferrer">
            <span>{t('pageCopy.openMap')} →</span>
          </a>
        </Card>

        <Card className="surface-card location-map" variant="borderless">
          <iframe title={t('pageCopy.locationTitle')} src={MAP_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </Card>
      </div>

      {/* Optional extra directions (landmarks, bus numbers) — the address and map above stand alone. */}
      <ContentSection slug="about.location" optional />

      <Text type="secondary" className="location-note">
        {t('about.contactCopy')}
      </Text>
    </div>
  )
}