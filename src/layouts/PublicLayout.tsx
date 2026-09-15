import {
  BookOutlined,
  CalendarOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  MenuOutlined,
  MoonOutlined,
  ReadOutlined,
  SolutionOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Layout, Select, Tooltip, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { languages, usePreferences } from '../app/preferences'
import { useSession } from '../auth/useSession'
import { BrandMark } from '../shared/BrandMark'

const { Header, Content, Footer } = Layout
const { Text } = Typography

type NavItem = { to: string; labelKey: 'nav.home' | 'nav.schedule' | 'nav.materials' | 'nav.news' | 'nav.courses' | 'nav.about'; icon: ReactNode }

const navigation: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: <HomeOutlined /> },
  { to: '/courses', labelKey: 'nav.courses', icon: <SolutionOutlined /> },
  { to: '/schedule', labelKey: 'nav.schedule', icon: <CalendarOutlined /> },
  { to: '/materials', labelKey: 'nav.materials', icon: <ReadOutlined /> },
  { to: '/news', labelKey: 'nav.news', icon: <BookOutlined /> },
  { to: '/about', labelKey: 'nav.about', icon: <InfoCircleOutlined /> },
]

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences()
  const session = useSession()

  const closeMenu = () => setMenuOpen(false)

  const renderNav = (variant: 'desktop' | 'mobile') => (
    <nav className={variant === 'mobile' ? 'mobile-nav' : 'site-nav'} aria-label={t('nav.navigation')}>
      {/* NavLink already applies `.active` and aria-current="page". */}
      {navigation.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={closeMenu}>
          {item.icon}
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )

  /**
   * The admin panel and the student portal are separate full-screen apps, so
   * they open in their own tab and leave the public site where it was. The
   * sign-in page is part of the public site and navigates in place.
   */
  const portal = session
    ? {
        to: session.role === 'admin' ? '/admin' : '/student',
        label: t(session.role === 'admin' ? 'session.roleAdmin' : 'session.roleStudent'),
        icon: session.role === 'admin' ? <TeamOutlined /> : <UserOutlined />,
        newTab: true,
      }
    : { to: '/login', label: t('nav.portal'), icon: <LoginOutlined />, newTab: false }

  const portalLinkProps = portal.newTab
    ? { target: '_blank' as const, rel: 'noreferrer' }
    : {}

  return (
    <Layout className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('nav.skipToContent')}
      </a>

      <Header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand" aria-label={t('brand.name')}>
            <BrandMark />
            <span>
              <strong>{t('brand.name')}</strong>
              <small>{t('brand.tagline')}</small>
            </span>
          </NavLink>

          {renderNav('desktop')}

          <div className="header-actions">
            <Tooltip title={t(theme === 'light' ? 'theme.dark' : 'theme.light')}>
              <Button
                className="icon-button"
                aria-label={t('theme.label')}
                icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                onClick={toggleTheme}
              />
            </Tooltip>

            <Select
              aria-label={t('language.label')}
              className="language-select"
              value={language}
              onChange={setLanguage}
              options={languages.map(({ value, label, title }) => ({ value, label, title }))}
            />

            <NavLink to={portal.to} {...portalLinkProps}>
              <Button type="primary" icon={portal.icon}>
                {portal.label}
              </Button>
            </NavLink>

            <Button
              className="menu-button icon-button"
              aria-label={t('nav.menu')}
              aria-expanded={menuOpen}
              icon={<MenuOutlined />}
              onClick={() => setMenuOpen(true)}
            />
          </div>
        </div>
      </Header>

      <Drawer title={t('nav.navigation')} placement="right" open={menuOpen} onClose={closeMenu}>
        {renderNav('mobile')}
        <NavLink to={portal.to} onClick={closeMenu} {...portalLinkProps}>
          <Button type="primary" block icon={portal.icon}>
            {portal.label}
          </Button>
        </NavLink>
        {/* Below 520px the header drops these two to fit; they live here instead. */}
        <div className="drawer-preferences">
          <Button
            block
            icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
            onClick={toggleTheme}
          >
            {t(theme === 'light' ? 'theme.dark' : 'theme.light')}
          </Button>
          <Select
            aria-label={t('language.label')}
            value={language}
            onChange={setLanguage}
            options={languages.map(({ value, title }) => ({ value, label: title }))}
          />
        </div>
      </Drawer>

      <Content className="site-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </Content>

      <Footer className="site-footer">
        <Text type="secondary">
          {t('brand.name')} · {new Date().getFullYear()} · {t('brand.footer')}
        </Text>
      </Footer>
    </Layout>
  )
}
