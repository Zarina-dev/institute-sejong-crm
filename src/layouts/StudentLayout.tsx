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
    { to: '/student', label: t('navStudentHome'), icon: <DashboardOutlined />, end: true },
    { to: '/student/profile', label: t('navProfile'), icon: <IdcardOutlined /> },
    { to: '/student/courses', label: t('navCourses'), icon: <AppstoreOutlined /> },
    { to: '/student/enrollments', label: t('navEnrollments'), icon: <CheckSquareOutlined /> },
    { to: '/student/materials', label: t('navMaterials'), icon: <FolderOpenOutlined /> },
    { to: '/student/exam-results', label: t('navExamResults'), icon: <FileDoneOutlined /> },
    { to: '/student/events', label: t('navEvents'), icon: <CalendarOutlined /> },
  ]

  return (
    <ShellLayout
      role="student"
      railSubtitle={t('studentPortal')}
      title={t('studentPortal')}
      navItems={navItems}
    />
  )
}
