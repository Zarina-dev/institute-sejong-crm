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
  /** 재직 중; false for someone who has left (still shown, marked as such). */
  isCurrent: boolean
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
  isCurrent?: boolean
}
