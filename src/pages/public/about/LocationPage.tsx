import { EnvironmentOutlined, InstagramOutlined, PhoneOutlined } from '@ant-design/icons'
import { Card, Typography } from 'antd'
import { useEffect, useState } from 'react'

import { contact, phoneHref } from '../../../app/contact'
import { usePreferences } from '../../../app/preferences'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

const { lat, lng, place } = contact.map

/**
 * The embed's final address, asked for directly: the short /maps?q=…&output=embed
 * form answers with a redirect and then searches the address on every visit.
 * Centred on the coordinates, pinned on the place, labelled in the reader's
 * language. No API key needed.
 */
const mapEmbed = (language: string) =>
  `https://www.google.com/maps/embed?origin=mfe&pb=!1m12!1m8!1m3!1d3034.45!2d${lng}!3d${lat}!3m2!1i1024!2i768!4f13.1!2m1!1s${encodeURIComponent(place)}!6i17!3m1!1s${language}!5m1!1s${language}`
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

/** Google's map servers: connecting to them while the page draws saves the handshakes later. */
const MAP_ORIGINS = ['https://www.google.com', 'https://maps.gstatic.com', 'https://maps.googleapis.com', 'https://khms0.googleapis.com']

function usePreconnect(origins: string[]) {
  useEffect(() => {
    const links = origins.map((href) => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = href
      link.crossOrigin = ''
      document.head.appendChild(link)
      return link
    })
    return () => links.forEach((link) => link.remove())
  }, [origins])
}

/** 오시는 길 — address, contacts and the map. */
export function LocationPage() {
  const { t, language } = usePreferences()
  const [mapReady, setMapReady] = useState(false)
  usePreconnect(MAP_ORIGINS)

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

        <Card className={`surface-card location-map${mapReady ? ' is-ready' : ''}`} variant="borderless">
          {/* Shown until Google has drawn the map — a pin and a word, not an empty box. */}
          <div className="location-map__placeholder" aria-hidden={mapReady}>
            <EnvironmentOutlined />
            <span>{t('pageCopy.mapLoading')}</span>
          </div>
          <iframe
            key={language}
            title={t('pageCopy.locationTitle')}
            src={mapEmbed(language)}
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setMapReady(true)}
          />
        </Card>
      </div>

      <Text type="secondary" className="location-note">
        {t('about.contactCopy')}
      </Text>
    </div>
  )
}
