import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'

import { PublicLayout } from '../layouts/PublicLayout'
import { AboutPage } from '../pages/public/AboutPage'
import { CoursesPage } from '../pages/public/CoursesPage'
import { HomePage } from '../pages/public/HomePage'
import { MaterialsPage } from '../pages/public/MaterialsPage'
import { NewsPage } from '../pages/public/NewsPage'
import { SchedulePage } from '../pages/public/SchedulePage'
import { StudentPortalPage } from '../pages/public/StudentPortalPage'

/**
 * The admin and student areas are only reachable after signing in, and the
 * admin tables in particular pull in a lot of Ant Design. Splitting them out
 * keeps the public bundle — the one every visitor downloads — small.
 */
const AdminLayout = lazy(() =>
  import('../layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)
const StudentLayout = lazy(() =>
  import('../layouts/StudentLayout').then((m) => ({ default: m.StudentLayout })),
)
const DashboardPage = lazy(() =>
  import('../pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ApplicationsAdminPage = lazy(() =>
  import('../pages/admin/ApplicationsAdminPage').then((m) => ({
    default: m.ApplicationsAdminPage,
  })),
)
const CoursesAdminPage = lazy(() =>
  import('../pages/admin/CoursesAdminPage').then((m) => ({ default: m.CoursesAdminPage })),
)
const MaterialsAdminPage = lazy(() =>
  import('../pages/admin/MaterialsAdminPage').then((m) => ({ default: m.MaterialsAdminPage })),
)
const NewsAdminPage = lazy(() =>
  import('../pages/admin/NewsAdminPage').then((m) => ({ default: m.NewsAdminPage })),
)
const ScheduleAdminPage = lazy(() =>
  import('../pages/admin/ScheduleAdminPage').then((m) => ({ default: m.ScheduleAdminPage })),
)
const StudentAdminPage = lazy(() =>
  import('../pages/admin/StudentAdminPage').then((m) => ({ default: m.StudentAdminPage })),
)
const StudentDashboardPage = lazy(() =>
  import('../pages/student/StudentDashboardPage').then((m) => ({
    default: m.StudentDashboardPage,
  })),
)
const StudentProfilePage = lazy(() =>
  import('../pages/student/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })),
)
const StudentCoursesPage = lazy(() =>
  import('../pages/student/StudentCoursesPage').then((m) => ({ default: m.StudentCoursesPage })),
)
const StudentEnrollmentsPage = lazy(() =>
  import('../pages/student/StudentEnrollmentsPage').then((m) => ({
    default: m.StudentEnrollmentsPage,
  })),
)
const StudentMaterialsPage = lazy(() =>
  import('../pages/student/StudentMaterialsPage').then((m) => ({
    default: m.StudentMaterialsPage,
  })),
)
const StudentExamResultsPage = lazy(() =>
  import('../pages/student/StudentExamResultsPage').then((m) => ({
    default: m.StudentExamResultsPage,
  })),
)
const StudentEventsPage = lazy(() =>
  import('../pages/student/StudentEventsPage').then((m) => ({ default: m.StudentEventsPage })),
)

function RouteFallback() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <Spin size="large" />
    </div>
  )
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public site — wrapped in the marketing header/footer. */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/login" element={<StudentPortalPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Authenticated areas are siblings of the public layout, not children
            of it: they are full-screen applications with their own chrome.
            Nested under <App /> they rendered inside the public header and
            footer and were squeezed into the 1240px marketing container. */}
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="enrollments" element={<StudentEnrollmentsPage />} />
          <Route path="materials" element={<StudentMaterialsPage />} />
          <Route path="exam-results" element={<StudentExamResultsPage />} />
          <Route path="events" element={<StudentEventsPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsAdminPage />} />
          <Route path="courses" element={<CoursesAdminPage />} />
          <Route path="materials" element={<MaterialsAdminPage />} />
          <Route path="students" element={<StudentAdminPage />} />
          <Route path="news" element={<NewsAdminPage />} />
          <Route path="schedule" element={<ScheduleAdminPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
