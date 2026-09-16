import {
  AppstoreOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  NotificationOutlined,
  SolutionOutlined,
  TeamOutlined,
} from '@ant-design/icons'

import { usePreferences } from '../app/preferences'
import { ShellLayout, type ShellNavItem } from './ShellLayout'

export function AdminLayout() {
  const { t } = usePreferences()

  /**
   * One entry per route actually registered in AppRouter. The previous list
   * advertised /admin/institute, /admin/events, /admin/exam-results and
   * /admin/users — none of which exist, so clicking them fell through to the
   * catch-all route and bounced the admin back to the public home page.
   */
  const navItems: ShellNavItem[] = [
    { to: '/admin', label: t('adminNav.dashboard'), icon: <DashboardOutlined />, end: true },
    { to: '/admin/applications', label: t('adminNav.applications'), icon: <SolutionOutlined /> },
    { to: '/admin/courses', label: t('adminNav.courses'), icon: <AppstoreOutlined /> },
    { to: '/admin/materials', label: t('adminNav.materials'), icon: <FolderOpenOutlined /> },
    { to: '/admin/students', label: t('adminNav.students'), icon: <TeamOutlined /> },
    { to: '/admin/news', label: t('adminNav.news'), icon: <NotificationOutlined /> },
    { to: '/admin/staff', label: t('adminNav.staff'), icon: <IdcardOutlined /> },
  ]

  return (
    <ShellLayout
      role="admin"
      railSubtitle={t('session.adminPanel')}
      title={t('session.adminPanel')}
      navItems={navItems}
    />
  )
}
