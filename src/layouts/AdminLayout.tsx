import {
  AppstoreOutlined,
  BookOutlined,
  DashboardOutlined,
  DownOutlined,
  HomeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  PictureOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  NotificationOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Layout, Select, Spin, Tooltip, Typography } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { languages, usePreferences } from '../app/preferences'
import { clearSession } from '../auth/session'
import { useSession, useSessionResolving } from '../auth/useSession'
import { BrandMark } from '../shared/BrandMark'
import { adminDashboard, adminNavigation, type AdminNavGroup } from './adminNavigation'

const { Content, Header, Sider } = Layout
const { Title } = Typography

/** Icons live here rather than in the nav data, which stays free of JSX. */
const SECTION_ICON: Record<string, ReactNode> = {
  'siteNav.about': <IdcardOutlined />,
  'siteNav.programmes': <AppstoreOutlined />,
  'siteNav.notices': <NotificationOutlined />,
  'siteNav.resources': <BookOutlined />,
  'siteNav.history': <PictureOutlined />,
}

/** A section owns the current page when one of its entries points at it. */
const holdsRoute = (group: AdminNavGroup, pathname: string, search: string) =>
  group.items.some((item) => item.to === `${pathname}${search}` || item.to.split('?')[0] === pathname)

/**
 * Sections open and close; the one holding the current page opens itself.
 * Kept as a set so an admin can keep two sections open at once.
 */
function useOpenSections(pathname: string, search: string) {
  const [open, setOpen] = useState<string[]>([])

  useEffect(() => {
    const current = adminNavigation.find((group) => holdsRoute(group, pathname, search))

    if (current) {
      setOpen((sections) => (sections.includes(current.labelKey) ? sections : [...sections, current.labelKey]))
    }
  }, [pathname, search])

  const toggle = (labelKey: string) =>
    setOpen((sections) => (sections.includes(labelKey) ? sections.filter((key) => key !== labelKey) : [...sections, labelKey]))

  return { open, toggle }
}

/**
 * The admin panel: the only authenticated area of the site. It renders
 * standalone (a sibling of the public layout, opened in its own tab), so it
 * carries its own header, skip link and preference controls.
 */
export function AdminLayout() {
  const session = useSession()
  const resolving = useSessionResolving()
  const navigate = useNavigate()
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences()
  const { pathname, search } = useLocation()
  const { open, toggle } = useOpenSections(pathname, search)
  const [collapsed, setCollapsed] = useState(false)

  // A tab opened from the public site receives the session over the
  // BroadcastChannel a moment after load; don't bounce to /login before then.
  if (!session && resolving) {
    return <Spin className="shell-resolving" size="large" />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }


  return (
    <Layout className="admin-shell" hasSider>
      <a className="skip-link" href="#main-content">
        {t('nav.skipToContent')}
      </a>

      <Sider
        className="admin-sider"
        width={260}
        collapsedWidth={0}
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={setCollapsed}
        trigger={null}
      >
        <div className="rail">
          <Link to="/" className="rail-brand">
            <BrandMark size={32} />
            <span>
              <strong>{t('brand.name')}</strong>
              <small>{t('session.adminPanel')}</small>
            </span>
          </Link>

          {/* The public menu, section by section: open a section and its
              pages are listed under it with the names visitors see. */}
          <nav className="rail-nav" aria-label={t('nav.navigation')}>
            <NavLink className="rail-link" to={adminDashboard.to} end={adminDashboard.end}>
              <DashboardOutlined />
              <span>{t(adminDashboard.labelKey)}</span>
            </NavLink>

            {adminNavigation.map((group) => {
              const expanded = open.includes(group.labelKey)
              const current = holdsRoute(group, pathname, search)

              return (
                <div
                  className={`rail-group${expanded ? ' is-open' : ''}${current ? ' is-current' : ''}`}
                  key={group.labelKey}
                >
                  <button
                    type="button"
                    className="rail-group__toggle"
                    aria-expanded={expanded}
                    onClick={() => toggle(group.labelKey)}
                  >
                    {SECTION_ICON[group.labelKey]}
                    <span className="rail-group__title">{t(group.labelKey)}</span>
                    <DownOutlined className="rail-group__chevron" />
                  </button>

                  {expanded ? (
                    <div className="rail-group__items">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          // NavLink matches on the path alone and several
                          // entries share a page, so the full URL — query
                          // included — decides which one is active. The
                          // callback form also suppresses NavLink's own class.
                          className={() => (item.to === `${pathname}${search}` ? 'rail-sublink active' : 'rail-sublink')}
                        >
                          {t(item.labelKey)}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>

          <div className="rail-user">
            <Avatar>{session.username.trim().charAt(0).toUpperCase()}</Avatar>
            <div>
              <strong>{session.username}</strong>
              <small>{t('session.roleAdmin')}</small>
            </div>
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className="admin-header">
          <div className="admin-header-title">
            {/* The sider collapses to zero width, so this is the only way
                back to the navigation on small screens. */}
            <Button
              className="icon-button"
              aria-label={t(collapsed ? 'session.expandMenu' : 'session.collapseMenu')}
              aria-expanded={!collapsed}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
            />
            <Title level={4}>{t('session.adminPanel')}</Title>
          </div>

          <div className="admin-header-actions">
            <Tooltip title={t('session.backToSite')}>
              <Link to="/">
                <Button className="icon-button" aria-label={t('session.backToSite')} icon={<HomeOutlined />} />
              </Link>
            </Tooltip>

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

            <Button icon={<LogoutOutlined />} onClick={handleLogout} className="logout-button">
              <span>{t('session.logout')}</span>
            </Button>
          </div>
        </Header>

        <Content className="admin-content" id="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
