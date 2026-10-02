import { apiGet } from '../../api/client'
import type { NewsCategory } from '../news/types'

/** Counted on the server — the dashboard used to download every row to count them. */
export type DashboardSummary = {
  courses: { total: number; drafts: number; programmes: number }
  news: { total: number; drafts: number }
  /** The newest few of each, for the activity feed. */
  recentCourses: Array<{ id: string; title: string; subject: string; createdAt: string; updatedAt: string }>
  recentNews: Array<{ id: string; title: string; category: NewsCategory; createdAt: string; updatedAt: string }>
}

export const getDashboard = () => apiGet<DashboardSummary>('/dashboard')
