export type StaffMember = {
  id: string
  name: string
  position: string
  bio: string
  /** Site-relative `/uploads/images/…` path or null; resolve with `assetUrl()`. */
  photoUrl: string | null
  email: string | null
  sortOrder: number
  isPublished: boolean
  /** 근무 시작일 (ISO) — may lie ahead for someone joining later. */
  startDate: string | null
  /** 퇴직일 (ISO) — only for someone who has left or is leaving. */
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export type StaffInput = {
  name: string
  position: string
  bio?: string
  photoUrl?: string | null
  email?: string | null
  sortOrder?: number
  isPublished?: boolean
  startDate?: string | null
  endDate?: string | null
}
