import {
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Layout, Select, Spin, Tooltip, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { languages, usePreferences } from '../app/preferences'
import { clearSession, type DemoRole } from '../auth/demoAuth'
import { useSession, useSessionResolving } from '../auth/useSession'
import { BrandMark } from '../shared/BrandMark'

const { Content, Header, Sider } = Layout
const { Title } = Typography

export type ShellNavItem = {
  to: string
  label: string
  icon: ReactNode
  /** Match only this exact path — needed for index routes like `/admin`. */
  end?: boolean
}

type ShellLayoutProps = {
  /** Only a session with this role may see the shell. */
  role: DemoRole
  /** Short label under the logo, e.g. "Admin panel". */
  railSubtitle: string
  /** Heading shown in the shell header. */
  title: string
  navItems: ShellNavItem[]
}

/**
 * Shared chrome for the authenticated areas (admin + student portal).
 *
 * Both shells used to carry their own copy of the sider, header, guard and
 * logout handler, styled with inline objects. That meant two places to fix
 * for every change, no dark-mode support, and — because the shells sit
 * outside the public header — no way to reach the theme or language switch
 * once you signed in. All of that lives here now.
 */
export function ShellLayout({ role, railSubtitle, title, navItems }: ShellLayoutProps) {
  const session = useSession()
  const resolving = useSessionResolving()
  const navigate = useNavigate()
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences()
  const [collapsed, setCollapsed] = useState(false)

  // A tab opened from the public site receives the session over the
  // BroadcastChannel a moment after load; don't bounce to /login before then.
  if (!session && resolving) {
    return <Spin className="shell-resolving" size="large" />
  }

  if (!session || session.role !== role) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const roleLabel = t(role === 'admin' ? 'session.roleAdmin' : 'session.roleStudent')

  return (
    <Layout className="admin-shell" hasSider>
      {/* These shells render standalone now, so they need their own skip
          link — the public header's is no longer above them. */}
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
              <small>{railSubtitle}</small>
            </span>
          </Link>

          <nav className="rail-nav" aria-label={t('nav.navigation')}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="rail-user">
            <Avatar>{session.displayName.trim().charAt(0).toUpperCase()}</Avatar>
            <div>
              <strong>{session.displayName}</strong>
              <small>{roleLabel}</small>
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
            <Title level={4}>{title}</Title>
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
              options={languages.map(({ value, label, title: optionTitle }) => ({
                value,
                label,
                title: optionTitle,
              }))}
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
