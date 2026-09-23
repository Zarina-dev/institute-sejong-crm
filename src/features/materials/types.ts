/**
 * Materials are classified by 과목 and 과정 only — 레벨 and 자료 유형 were
 * removed from 자료실, along with their filters.
 */
export type MaterialsFilters = {
  page?: number
  limit?: number
  search?: string
  subject?: string
  course?: string
  /** Filter by course record — preferred over the free-text `course` label. */
  courseId?: string
  published?: 'true' | 'false' | 'all'
  sortBy?: 'title' | 'updatedAt' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
}

export type MaterialItem = {
  id: string
  title: string
  description: string | null
  subject: string
  course: string
  /** Linked course; null on legacy rows whose label matched no course. */
  courseId: string | null
  fileType?: string | null
  fileSize?: number | null
  originalFileName?: string | null
  storageKey?: string | null
  thumbnailUrl?: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type MaterialListResponse = {
  items: MaterialItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}
