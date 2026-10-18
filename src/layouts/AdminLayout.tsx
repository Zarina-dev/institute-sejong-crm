import {
  AppstoreOutlined,
  AuditOutlined,
  BookOutlined,
  DashboardOutlined,
  DownOutlined,
  HistoryOutlined,
  HomeOutlined,
  IdcardOutlined,
  KeyOutlined,
  LogoutOutlined,
  PictureOutlined,
  RestOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  NotificationOutlined,
  SunOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Grid, Layout, Select, Spin, Tooltip, Typography } from 'antd'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { languages, usePreferences } from '../app/preferences'
import { useSession, useSessionResolving } from '../auth/useSession'
import { ChangePasswordModal } from '../features/auth/ChangePasswordModal'
import { useLogout, useMe } from '../features/auth/queries'
import { BrandMark } from '../shared/BrandMark'
import { useScrollReset } from '../shared/useScrollReset'
import { adminAccounts, adminAudit, adminDashboard, adminNavigation, adminTrash, type AdminNavGroup } from './adminNavigation'
import { PageSuspense } from '../shared/PageSuspense'

const { Content, Header, Sider } = Layout
const { Title } = Typography

/** Icons live here rather than in the nav data, which stays free of JSX. */
const SECTION_ICON: Record<string, ReactNode> = {
  'siteNav.about': <IdcardOutlined />,
  'siteNav.programmes': <AppstoreOutlined />,
  'siteNav.notices': <NotificationOutlined />,
  'siteNav.resources': <BookOutlined />,
  'siteNav.history': <PictureOutlined />,
  'adminNav.meetingsSection': <AuditOutlined />,
}

/**
 * The section the current URL belongs to. Entries share a screen and differ
 * by their query, so the full URL decides; the path alone is only a fallback
 * for the moment before a page normalises its query.
 */
const sectionOf = (url: string): AdminNavGroup | undefined =>
  adminNavigation.find((group) => group.items.some((item) => item.to === url)) ??
  adminNavigation.find((group) => group.items.some((item) => item.to.split('?')[0] === url.split('?')[0]))

/**
 * Sections open and close; the one holding the current page opens itself.
 * Kept as a list so an admin can keep two sections open at once.
 */
function useOpenSections(url: string) {
  const [open, setOpen] = useState<string[]>([])

  useEffect(() => {
    const current = sectionOf(url)

    if (current) {
      setOpen((sections) => (sections.includes(current.labelKey) ? sections : [...sections, current.labelKey]))
    }
  }, [url])

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
  const url = `${pathname}${search}`
  const { open, toggle } = useOpenSections(url)
  useScrollReset()
  const currentSection = sectionOf(url)
  const [collapsed, setCollapsed] = useState(false)
  // Below lg the rail opens over the page (see .admin-sider): a backdrop
  // closes it, and so does going to another page.
  const narrow = Grid.useBreakpoint().lg === false
  // Name and role as they are now, not as they were at sign-in; a 401 here
  // (deactivated, signed out elsewhere) ends this tab's session too.
  useMe(Boolean(session))
  const logout = useLogout()
  const [passwordOpen, setPasswordOpen] = useState(false)

  useEffect(() => {
    if (narrow) {
      setCollapsed(true)
    }
  }, [narrow, url])

  // A tab opened from the public site receives the session over the
  // BroadcastChannel a moment after load; don't bounce to /login before then.
  if (!session && resolving) {
    return <Spin className="shell-resolving" size="large" />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })
  }
  const isAdmin = session.role === 'ADMIN'
  const displayName = session.fullName || session.username

  return (
    <Layout className="admin-shell" hasSider>
      <a className="skip-link" href="#main-content">
        {t('nav.skipToContent')}
      </a>

      {narrow && !collapsed ? <div className="admin-backdrop" role="presentation" onClick={() => setCollapsed(true)} /> : null}

      <Sider className="admin-sider" width={260} collapsedWidth={0} collapsed={collapsed} breakpoint="lg" onBreakpoint={setCollapsed} trigger={null}>
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
              const current = group === currentSection

              return (
                <div className={`rail-group${expanded ? ' is-open' : ''}${current ? ' is-current' : ''}`} key={group.labelKey}>
                  <button type="button" className="rail-group__toggle" aria-expanded={expanded} onClick={() => toggle(group.labelKey)}>
                    {SECTION_ICON[group.labelKey]}
                    <span className="rail-group__title">{t(group.labelKey)}</span>
                    <DownOutlined className="rail-group__chevron" />
                  </button>

                  {expanded ? (
                    <div className="rail-group__items">
                      {group.items.map((item) =>
                        item.disabled ? (
                          // The name stays so the page is accounted for; it
                          // simply is not managed from here.
                          <Tooltip title={item.disabledReasonKey ? t(item.disabledReasonKey) : undefined} placement="right" key={item.to}>
                            <span className="rail-sublink is-disabled" aria-disabled="true">
                              {t(item.labelKey)}
                            </span>
                          </Tooltip>
                        ) : (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            // NavLink matches on the path alone and several
                            // entries share a page, so the full URL — query
                            // included — decides which one is active. The
                            // callback form also suppresses NavLink's own class.
                            className={() => (item.to === url ? 'rail-sublink active' : 'rail-sublink')}
                          >
                            {t(item.labelKey)}
                          </NavLink>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}

            <NavLink className="rail-link rail-link--trash" to={adminTrash.to}>
              <RestOutlined />
              <span>{t(adminTrash.labelKey)}</span>
            </NavLink>
            {/* The journal and the accounts are the administrators' (the API refuses anyone else). */}
            {isAdmin ? (
              <>
                <NavLink className="rail-link" to={adminAudit.to}>
                  <HistoryOutlined />
                  <span>{t(adminAudit.labelKey)}</span>
                </NavLink>
                <NavLink className="rail-link" to={adminAccounts.to}>
                  <TeamOutlined />
                  <span>{t(adminAccounts.labelKey)}</span>
                </NavLink>
              </>
            ) : null}
          </nav>

          <div className="rail-user">
            <Avatar>{displayName.trim().charAt(0).toUpperCase()}</Avatar>
            <div>
              <strong title={session.username}>{displayName}</strong>
              <small>{t(isAdmin ? 'session.roleAdmin' : 'session.roleStaff')}</small>
            </div>
            <Tooltip title={t('session.changePassword')}>
              <Button type="text" size="small" aria-label={t('session.changePassword')} icon={<KeyOutlined />} onClick={() => setPasswordOpen(true)} />
            </Tooltip>
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

            <Button
              className="icon-button"
              aria-label={t('theme.label')}
              icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
              onClick={toggleTheme}
            />

            <Select
              aria-label={t('language.label')}
              className="language-select"
              value={language}
              onChange={setLanguage}
              options={languages.map(({ value, label, title }) => ({ value, label, title }))}
            />

            <Button icon={<LogoutOutlined />} onClick={handleLogout} loading={logout.isPending} className="logout-button">
              <span>{t('session.logout')}</span>
            </Button>
          </div>
        </Header>

        <Content className="admin-content" id="main-content">
          <PageSuspense>
            <Outlet />
          </PageSuspense>
        </Content>
      </Layout>

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </Layout>
  )
}
