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
  published?: 'true' | 'false' | 'all'
  studentId?: string
  sortBy?: 'title' | 'updatedAt' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
}

export type MaterialsListResult = {
  items: Array<{
    id: string
    title: string
    description?: string | null
    subject: string
    course: string
    fileType?: string | null
    fileSize?: number | null
    originalFileName?: string | null
    storageKey?: string | null
    thumbnailUrl?: string | null
    isPublished: boolean
    createdAt: string
    updatedAt: string
  }>
  page: number
  limit: number
  total: number
  totalPages: number
}
