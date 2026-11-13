import {
  DownOutlined,
  EnvironmentOutlined,
  InstagramOutlined,
  LoginOutlined,
  MenuOutlined,
  MoonOutlined,
  PhoneOutlined,
  SunOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Dropdown, Layout, Typography } from 'antd'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { contact, phoneHref } from '../app/contact'
import { languages, usePreferences, type Language } from '../app/preferences'
import { useSession } from '../auth/useSession'
import { BrandMark } from '../shared/BrandMark'
import { useScrollReset } from '../shared/useScrollReset'
import { navigation } from './navigation'
import { PageSuspense } from '../shared/PageSuspense'

const { Header, Content, Footer } = Layout
const { Text } = Typography

/**
 * Language menu. A Dropdown + Button, not antd's Select: Select drags
 * rc-select and rc-virtual-list into the entry chunk every visitor downloads
 * before anything is drawn, and these four options need neither search nor
 * virtual scrolling. `compact` shows the short code (EN) in the header strip;
 * the drawer shows the full name on a full-width button.
 */
function LanguagePicker({ compact, language, label, onChange }: { compact?: boolean; language: Language; label: string; onChange: (language: Language) => void }) {
  const current = languages.find((item) => item.value === language)

  return (
    <Dropdown
      trigger={['click']}
      placement={compact ? 'bottomRight' : 'bottom'}
      menu={{
        selectedKeys: [language],
        items: languages.map(({ value, title }) => ({ key: value, label: title })),
        onClick: ({ key }) => onChange(key as Language),
      }}
    >
      <Button
        className={compact ? 'language-select' : undefined}
        type={compact ? 'text' : 'default'}
        size={compact ? 'small' : 'middle'}
        block={!compact}
        // The name starts with what is on the button ("KO", "한국어"), so
        // voice control can target it, then says what it is for (WCAG 2.5.3).
        aria-label={`${compact ? current?.label : current?.title} — ${label}`}
        aria-haspopup="menu"
      >
        {compact ? current?.label : current?.title} <DownOutlined className="language-select__caret" />
      </Button>
    </Dropdown>
  )
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences()
  const session = useSession()
  const { pathname } = useLocation()
  useScrollReset()

  const closeMenu = () => setMenuOpen(false)

  /** A section is current when the route is inside it, not just on its landing page. */
  const isCurrentSection = (to: string) => pathname === to || pathname.startsWith(`${to}/`)

  /**
   * The admin panel is a separate full-screen app, so it opens in its own
   * tab and leaves the public site where it was. Same origin and an opener,
   * so the new tab inherits the session from sessionStorage.
   */
  const portal = session
    ? { to: '/admin', label: t('session.adminPanel'), icon: <TeamOutlined />, newTab: true }
    : { to: '/login', label: t('nav.login'), icon: <LoginOutlined />, newTab: false }
  const portalLinkProps = portal.newTab ? { target: '_blank' as const } : {}

  return (
    <Layout className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('nav.skipToContent')}
      </a>

      {/* The strip and the menu stay in view together: language, theme and
          the sign-in are as reachable at the foot of a page as at its top. */}
      <div className="site-top">
        {/* Utility strip: contact details and preferences, above the main menu. */}
        <div className="utility-bar">
          <div className="utility-bar__inner">
            <div className="utility-bar__contact">
              <a href={phoneHref}>
                <PhoneOutlined /> {contact.phone}
              </a>
              <span>
                <EnvironmentOutlined /> {contact.address}
              </span>
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                <InstagramOutlined /> {contact.instagramHandle}
              </a>
            </div>

            <div className="utility-bar__actions">
              {/* The moon or the sun says it all: no wording beside it. */}
              <Button
                type="text"
                size="small"
                aria-label={t('theme.label')}
                icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                onClick={toggleTheme}
              />
              <LanguagePicker compact language={language} label={t('language.label')} onChange={setLanguage} />
              {/* The link is the one tab stop: a focusable button inside it
                  made keyboard users tab twice to the same place (the same
                  tabIndex={-1} is used wherever a Link wraps a Button). */}
              <NavLink to={portal.to} {...portalLinkProps}>
                <Button tabIndex={-1} type="primary" size="small" icon={portal.icon}>
                  {portal.label}
                </Button>
              </NavLink>
            </div>
          </div>
        </div>

        <Header className="site-header">
          <div className="header-inner">
            {/* No aria-label: the visible wordmark is the name, and a label
                that differs from what is on screen breaks voice control
                ("click 오시 1 세종학당") — WCAG 2.5.3. */}
            <NavLink to="/" className="brand">
              <BrandMark />
              <span>
                <strong className="brand-name--full">{t('brand.name')}</strong>
                <strong className="brand-name--short">{t('brand.short')}</strong>
                <small>{t('brand.tagline')}</small>
              </span>
            </NavLink>

            <nav className="site-nav" aria-label={t('nav.navigation')}>
              <NavLink to="/" end>
                {t('siteNav.home')}
              </NavLink>
              {/* A section tab only opens its menu — hovering or clicking it never
                leaves the current page; the sub-item does the navigating. */}
              {navigation.map((section) => (
                <Dropdown
                  key={section.to}
                  placement="bottomLeft"
                  trigger={['hover', 'click']}
                  // Inside the pinned header, not at the end of <body>: a menu
                  // opened at the foot of a long page otherwise sits at
                  // document coordinates and the page jumps up to it.
                  getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                  menu={{
                    items: section.children.map((child) => ({
                      key: child.to,
                      label: <Link to={child.to}>{t(child.labelKey)}</Link>,
                    })),
                  }}
                >
                  <button
                    type="button"
                    className={isCurrentSection(section.to) ? 'site-nav__section active' : 'site-nav__section'}
                    aria-current={isCurrentSection(section.to) ? 'page' : undefined}
                    aria-haspopup="menu"
                  >
                    {t(section.labelKey)} <DownOutlined className="site-nav__caret" />
                  </button>
                </Dropdown>
              ))}
            </nav>

            <Button
              className="menu-button icon-button"
              aria-label={t('nav.menu')}
              aria-expanded={menuOpen}
              icon={<MenuOutlined />}
              onClick={() => setMenuOpen(true)}
            />
          </div>
        </Header>
      </div>

      <Drawer title={t('nav.navigation')} placement="right" open={menuOpen} onClose={closeMenu}>
        <nav className="mobile-nav" aria-label={t('nav.navigation')}>
          <NavLink to="/" end onClick={closeMenu}>
            {t('siteNav.home')}
          </NavLink>
          {navigation.map((section) => (
            <div className="mobile-nav__section" key={section.to}>
              <Text className="mobile-nav__label">{t(section.labelKey)}</Text>
              {section.children.map((child) => (
                <NavLink key={child.to} to={child.to} end onClick={closeMenu}>
                  {t(child.labelKey)}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="drawer-preferences">
          <NavLink to={portal.to} onClick={closeMenu} {...portalLinkProps}>
            <Button tabIndex={-1} type="primary" block icon={portal.icon}>
              {portal.label}
            </Button>
          </NavLink>
          <Button block aria-label={t('theme.label')} icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />} onClick={toggleTheme} />
          <LanguagePicker language={language} label={t('language.label')} onChange={setLanguage} />
        </div>
      </Drawer>

      <Content className="site-content" id="main-content" tabIndex={-1}>
        <PageSuspense>
          <Outlet />
        </PageSuspense>
      </Content>

      <Footer className="site-footer">
        <div className="site-footer__columns">
          <div className="site-footer__brand">
            <BrandMark size={36} />
            <strong>{t('brand.name')}</strong>
            <Text type="secondary">{t('brand.tagline')}</Text>
          </div>

          <div className="site-footer__column">
            <strong>{t('about.contactKicker')}</strong>
            <span>
              <EnvironmentOutlined /> {contact.address}
            </span>
            <a href={phoneHref}>
              <PhoneOutlined /> {contact.phone}
            </a>
            <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
              <InstagramOutlined /> {contact.instagramHandle}
            </a>
          </div>
        </div>

        <Text type="secondary" className="site-footer__copyright">
          {t('brand.name')} · {new Date().getFullYear()} · {t('brand.footer')}
        </Text>
      </Footer>
    </Layout>
  )
}
