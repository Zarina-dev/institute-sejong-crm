import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
} from '@ant-design/icons'

import { usePreferences } from '../app/preferences'
import { ShellLayout, type ShellNavItem } from './ShellLayout'

export function StudentLayout() {
  const { t } = usePreferences()

  const navItems: ShellNavItem[] = [
    { to: '/student', label: t('studentNav.home'), icon: <DashboardOutlined />, end: true },
    { to: '/student/profile', label: t('studentNav.profile'), icon: <IdcardOutlined /> },
    { to: '/student/courses', label: t('studentNav.courses'), icon: <AppstoreOutlined /> },
    { to: '/student/enrollments', label: t('studentNav.enrollments'), icon: <CheckSquareOutlined /> },
    { to: '/student/materials', label: t('studentNav.materials'), icon: <FolderOpenOutlined /> },
    { to: '/student/exam-results', label: t('studentNav.examResults'), icon: <FileDoneOutlined /> },
    { to: '/student/events', label: t('studentNav.events'), icon: <CalendarOutlined /> },
  ]

  return (
    <ShellLayout
      role="student"
      railSubtitle={t('session.studentPortal')}
      title={t('session.studentPortal')}
      navItems={navItems}
    />
  )
}
