import { Spin } from 'antd'
import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { PublicLayout } from '../layouts/PublicLayout'
import { HomePage } from '../pages/public/HomePage'

/**
 * Only the home page comes with the site. Every other public page is loaded
 * the first time it is opened — and fetched ahead once the browser is idle
 * (usePrefetchPublicPages) — and the admin panel, reachable only after
 * signing in, loads page by page. The bundle every visitor downloads stays
 * small.
 */
const publicPages = {
  GreetingPage: () => import('../pages/public/about/GreetingPage'),
  LocationPage: () => import('../pages/public/about/LocationPage'),
  StaffPage: () => import('../pages/public/about/StaffPage'),
  StudiesPage: () => import('../pages/public/history/StudiesPage'),
  GraduatesPage: () => import('../pages/public/history/GraduatesPage'),
  HistoryPage: () => import('../pages/public/HistoryPage'),
  LoginPage: () => import('../pages/public/LoginPage'),
  FaqPage: () => import('../pages/public/notices/FaqPage'),
  EventsPage: () => import('../pages/public/notices/EventsPage'),
  NoticesPage: () => import('../pages/public/notices/NoticesPage'),
  NewsDetailPage: () => import('../pages/public/NewsDetailPage'),
  CalendarPage: () => import('../pages/public/programmes/CalendarPage'),
  CoursesPage: () => import('../pages/public/programmes/CoursesPage'),
  LinksPage: () => import('../pages/public/resources/LinksPage'),
  MaterialsPage: () => import('../pages/public/resources/MaterialsPage'),
  TextbooksPage: () => import('../pages/public/resources/TextbooksPage'),
}

const GreetingPage = lazy(() => publicPages.GreetingPage().then((m) => ({ default: m.GreetingPage })))
const LocationPage = lazy(() => publicPages.LocationPage().then((m) => ({ default: m.LocationPage })))
const StaffPage = lazy(() => publicPages.StaffPage().then((m) => ({ default: m.StaffPage })))
const StudiesPage = lazy(() => publicPages.StudiesPage().then((m) => ({ default: m.StudiesPage })))
const GraduatesPage = lazy(() => publicPages.GraduatesPage().then((m) => ({ default: m.GraduatesPage })))
const HistoryPage = lazy(() => publicPages.HistoryPage().then((m) => ({ default: m.HistoryPage })))
const LoginPage = lazy(() => publicPages.LoginPage().then((m) => ({ default: m.LoginPage })))
const FaqPage = lazy(() => publicPages.FaqPage().then((m) => ({ default: m.FaqPage })))
const EventsPage = lazy(() => publicPages.EventsPage().then((m) => ({ default: m.EventsPage })))
const NoticesPage = lazy(() => publicPages.NoticesPage().then((m) => ({ default: m.NoticesPage })))
const NewsDetailPage = lazy(() => publicPages.NewsDetailPage().then((m) => ({ default: m.NewsDetailPage })))
const CalendarPage = lazy(() => publicPages.CalendarPage().then((m) => ({ default: m.CalendarPage })))
const CoursesPage = lazy(() => publicPages.CoursesPage().then((m) => ({ default: m.CoursesPage })))
const LinksPage = lazy(() => publicPages.LinksPage().then((m) => ({ default: m.LinksPage })))
const MaterialsPage = lazy(() => publicPages.MaterialsPage().then((m) => ({ default: m.MaterialsPage })))
const TextbooksPage = lazy(() => publicPages.TextbooksPage().then((m) => ({ default: m.TextbooksPage })))
const AdminLayout = lazy(() => import('../layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const CoursesAdminPage = lazy(() => import('../pages/admin/CoursesAdminPage').then((m) => ({ default: m.CoursesAdminPage })))
const MaterialsAdminPage = lazy(() => import('../pages/admin/MaterialsAdminPage').then((m) => ({ default: m.MaterialsAdminPage })))
const NewsAdminPage = lazy(() => import('../pages/admin/NewsAdminPage').then((m) => ({ default: m.NewsAdminPage })))
const StaffAdminPage = lazy(() => import('../pages/admin/StaffAdminPage').then((m) => ({ default: m.StaffAdminPage })))
const ContentAdminPage = lazy(() => import('../pages/admin/ContentAdminPage').then((m) => ({ default: m.ContentAdminPage })))
const TextbooksAdminPage = lazy(() => import('../pages/admin/TextbooksAdminPage').then((m) => ({ default: m.TextbooksAdminPage })))
const CompetitionsAdminPage = lazy(() => import('../pages/admin/CompetitionsAdminPage').then((m) => ({ default: m.CompetitionsAdminPage })))
const GraduatesAdminPage = lazy(() => import('../pages/admin/GraduatesAdminPage').then((m) => ({ default: m.GraduatesAdminPage })))
const StudiesAdminPage = lazy(() => import('../pages/admin/StudiesAdminPage').then((m) => ({ default: m.StudiesAdminPage })))
const MeetingsAdminPage = lazy(() => import('../pages/admin/MeetingsAdminPage').then((m) => ({ default: m.MeetingsAdminPage })))
const TermsAdminPage = lazy(() => import('../pages/admin/TermsAdminPage').then((m) => ({ default: m.TermsAdminPage })))
const ChronologyAdminPage = lazy(() => import('../pages/admin/ChronologyAdminPage').then((m) => ({ default: m.ChronologyAdminPage })))
const EventsAdminPage = lazy(() => import('../pages/admin/EventsAdminPage').then((m) => ({ default: m.EventsAdminPage })))
const AuditAdminPage = lazy(() => import('../pages/admin/AuditAdminPage').then((m) => ({ default: m.AuditAdminPage })))
const TrashAdminPage = lazy(() => import('../pages/admin/TrashAdminPage').then((m) => ({ default: m.TrashAdminPage })))

function RouteFallback() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <Spin size="large" />
    </div>
  )
}

/**
 * Once the first page is on screen and the browser has nothing to do, the
 * other public pages are fetched in the background, so a visitor's next
 * click opens at once instead of waiting for its code.
 */
function usePrefetchPublicPages() {
  useEffect(() => {
    const prefetch = () => Object.values(publicPages).forEach((load) => void load().catch(() => {}))
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(prefetch, 2000)
    return () => clearTimeout(id)
  }, [])
}

export function AppRouter() {
  usePrefetchPublicPages()

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
          <Route path="/programmes" element={<CoursesPage key="language" category="language" />} />
          <Route path="/programmes/calendar" element={<CalendarPage />} />
          <Route path="/programmes/culture" element={<CoursesPage key="culture" category="culture" />} />

          {/* 알림마당 */}
          <Route path="/notices" element={<NoticesPage variant="notice" />} />
          <Route path="/notices/press" element={<NoticesPage variant="press" />} />
          <Route path="/notices/events" element={<EventsPage />} />
          <Route path="/notices/faq" element={<FaqPage />} />
          <Route path="/notices/:id" element={<NewsDetailPage />} />

          {/* 학습자료실 */}
          <Route path="/resources" element={<TextbooksPage />} />
          <Route path="/resources/materials" element={<MaterialsPage />} />
          <Route path="/resources/links" element={<LinksPage />} />

          {/* 학당 발자취 */}
          {/* 행사·대회: events and competitions together, a year at a time. */}
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/studies" element={<StudiesPage />} />
          <Route path="/history/graduates" element={<GraduatesPage />} />
          {/* Competitions used to have pages of their own; old links still land. */}
          <Route path="/history/competitions" element={<Navigate to="/history" replace />} />
          <Route path="/history/speech" element={<Navigate to="/history" replace />} />
          <Route path="/history/writing" element={<Navigate to="/history" replace />} />

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
          {/* Albums are 행사·대회 records now; the old address still lands. */}
          <Route path="gallery" element={<Navigate to="/admin/competitions" replace />} />
          <Route path="staff" element={<StaffAdminPage />} />
          <Route path="textbooks" element={<TextbooksAdminPage />} />
          <Route path="content" element={<ContentAdminPage />} />
          <Route path="terms" element={<TermsAdminPage />} />
          <Route path="chronology" element={<ChronologyAdminPage />} />
          <Route path="events" element={<EventsAdminPage />} />
          <Route path="competitions" element={<CompetitionsAdminPage />} />
          <Route path="studies" element={<StudiesAdminPage />} />
          <Route path="graduates" element={<GraduatesAdminPage />} />
          <Route path="meetings" element={<MeetingsAdminPage />} />
          <Route path="trash" element={<TrashAdminPage />} />
          <Route path="audit" element={<AuditAdminPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
