import { Spin } from 'antd'
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { PublicLayout } from '../layouts/PublicLayout'
import { AboutPage } from '../pages/public/AboutPage'
import { CoursesPage } from '../pages/public/CoursesPage'
import { HomePage } from '../pages/public/HomePage'
import { LoginPage } from '../pages/public/LoginPage'
import { NewsDetailPage } from '../pages/public/NewsDetailPage'
import { NewsPage } from '../pages/public/NewsPage'
import { SchedulePage } from '../pages/public/SchedulePage'

/**
 * The admin panel is only reachable after signing in, and its tables pull in
 * a lot of Ant Design. Splitting it out keeps the public bundle — the one
 * every visitor downloads — small.
 */
const AdminLayout = lazy(() => import('../layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const CoursesAdminPage = lazy(() => import('../pages/admin/CoursesAdminPage').then((m) => ({ default: m.CoursesAdminPage })))
const MaterialsAdminPage = lazy(() => import('../pages/admin/MaterialsAdminPage').then((m) => ({ default: m.MaterialsAdminPage })))
const NewsAdminPage = lazy(() => import('../pages/admin/NewsAdminPage').then((m) => ({ default: m.NewsAdminPage })))
const StaffAdminPage = lazy(() => import('../pages/admin/StaffAdminPage').then((m) => ({ default: m.StaffAdminPage })))

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
        {/* Public site — everything a visitor can see, no sign-in needed. */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* The admin panel is a sibling of the public layout, not a child:
            it is a standalone full-screen application with its own chrome. */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesAdminPage />} />
          <Route path="materials" element={<MaterialsAdminPage />} />
          <Route path="news" element={<NewsAdminPage />} />
          <Route path="staff" element={<StaffAdminPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
