import {
  AppstoreOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  NotificationOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Layout, Select, Spin, Tooltip, Typography } from 'antd'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { languages, usePreferences } from '../app/preferences'
import { clearSession } from '../auth/session'
import { useSession, useSessionResolving } from '../auth/useSession'
import { BrandMark } from '../shared/BrandMark'

const { Content, Header, Sider } = Layout
const { Title } = Typography

type NavItem = {
  to: string
  label: string
  icon: ReactNode
  /** Match only this exact path — needed for the index route `/admin`. */
  end?: boolean
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

  const navItems: NavItem[] = [
    { to: '/admin', label: t('adminNav.dashboard'), icon: <DashboardOutlined />, end: true },
    { to: '/admin/courses', label: t('adminNav.courses'), icon: <AppstoreOutlined /> },
    { to: '/admin/materials', label: t('adminNav.materials'), icon: <FolderOpenOutlined /> },
    { to: '/admin/news', label: t('adminNav.news'), icon: <NotificationOutlined /> },
    { to: '/admin/staff', label: t('adminNav.staff'), icon: <IdcardOutlined /> },
  ]

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

          <nav className="rail-nav" aria-label={t('nav.navigation')}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
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
