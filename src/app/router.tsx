import { Spin } from 'antd'
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { PublicLayout } from '../layouts/PublicLayout'
import { GreetingPage } from '../pages/public/about/GreetingPage'
import { LocationPage } from '../pages/public/about/LocationPage'
import { StaffPage } from '../pages/public/about/StaffPage'
import { HistoryPage } from '../pages/public/HistoryPage'
import { HomePage } from '../pages/public/HomePage'
import { LoginPage } from '../pages/public/LoginPage'
import { FaqPage } from '../pages/public/notices/FaqPage'
import { NoticesPage } from '../pages/public/notices/NoticesPage'
import { NewsDetailPage } from '../pages/public/NewsDetailPage'
import { CalendarPage } from '../pages/public/programmes/CalendarPage'
import { CoursesPage } from '../pages/public/programmes/CoursesPage'
import { LinksPage } from '../pages/public/resources/LinksPage'
import { MaterialsPage } from '../pages/public/resources/MaterialsPage'
import { TextbooksPage } from '../pages/public/resources/TextbooksPage'

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
const GalleryAdminPage = lazy(() => import('../pages/admin/GalleryAdminPage').then((m) => ({ default: m.GalleryAdminPage })))
const ContentAdminPage = lazy(() => import('../pages/admin/ContentAdminPage').then((m) => ({ default: m.ContentAdminPage })))

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
        {/* Public site — the five sections of the site plan, no sign-in needed. */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />

          {/* 학당 소개 */}
          <Route path="/about" element={<GreetingPage />} />
          <Route path="/about/staff" element={<StaffPage />} />
          <Route path="/about/location" element={<LocationPage />} />

          {/* 교육과정 */}
          <Route path="/programmes" element={<CoursesPage category="language" />} />
          <Route path="/programmes/calendar" element={<CalendarPage />} />
          <Route path="/programmes/culture" element={<CoursesPage category="culture" />} />

          {/* 알림마당 */}
          <Route path="/notices" element={<NoticesPage variant="notice" />} />
          <Route path="/notices/press" element={<NoticesPage variant="press" />} />
          <Route path="/notices/faq" element={<FaqPage />} />
          <Route path="/notices/:id" element={<NewsDetailPage />} />

          {/* 학습자료실 */}
          <Route path="/resources" element={<TextbooksPage />} />
          <Route path="/resources/materials" element={<MaterialsPage />} />
          <Route path="/resources/links" element={<LinksPage />} />

          {/* 학당 발자취 */}
          <Route path="/history" element={<HistoryPage />} />

          <Route path="/login" element={<LoginPage />} />

          {/* Routes from the previous structure, kept as redirects so old links live. */}
          <Route path="/courses" element={<Navigate to="/programmes" replace />} />
          <Route path="/schedule" element={<Navigate to="/programmes/calendar" replace />} />
          <Route path="/news" element={<Navigate to="/notices" replace />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/materials" element={<Navigate to="/resources/materials" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* The admin panel is a sibling of the public layout, not a child:
            it is a standalone full-screen application with its own chrome. */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesAdminPage />} />
          <Route path="materials" element={<MaterialsAdminPage />} />
          <Route path="news" element={<NewsAdminPage />} />
          <Route path="gallery" element={<GalleryAdminPage />} />
          <Route path="staff" element={<StaffAdminPage />} />
          <Route path="content" element={<ContentAdminPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
