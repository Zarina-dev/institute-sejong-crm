import {
  AppstoreOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
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
    { to: '/admin', label: t('navDashboard'), icon: <DashboardOutlined />, end: true },
    { to: '/admin/applications', label: t('navApplications'), icon: <SolutionOutlined /> },
    { to: '/admin/courses', label: t('navCourses'), icon: <AppstoreOutlined /> },
    { to: '/admin/materials', label: t('navMaterials'), icon: <FolderOpenOutlined /> },
    { to: '/admin/students', label: t('navStudents'), icon: <TeamOutlined /> },
  ]

  return (
    <ShellLayout
      role="admin"
      railSubtitle={t('adminPanel')}
      title={t('adminPanel')}
      navItems={navItems}
    />
  )
}
