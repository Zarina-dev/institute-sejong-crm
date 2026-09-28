import { HomeOutlined, RightOutlined } from '@ant-design/icons'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'

import { usePreferences } from '../app/preferences'
import type { BreadcrumbStep } from './useBreadcrumbTrail'

/** 홈 › 학당 소개 › 인사말 — where the visitor is standing, as sites here show it. */
export function Breadcrumbs({ trail }: { trail: BreadcrumbStep[] }) {
  const { t } = usePreferences()

  if (trail.length === 0) {
    return null
  }

  return (
    <nav className="breadcrumbs" aria-label={t('nav.navigation')}>
      <Link to="/" aria-label={t('siteNav.home')}>
        <HomeOutlined />
      </Link>

      {trail.map((step, index) => (
        <Fragment key={`${step.to}-${index}`}>
          <RightOutlined className="breadcrumbs__sep" aria-hidden="true" />
          {index === trail.length - 1 ? <span aria-current="page">{step.label}</span> : <Link to={step.to}>{step.label}</Link>}
        </Fragment>
      ))}
    </nav>
  )
}
