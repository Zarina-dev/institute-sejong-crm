export type Textbook = {
  id: string
  /** 교재명 */
  title: string
  /** 교재 소개 */
  description: string
  /** 교재 사진 — site-relative `/uploads/images/…` path. */
  coverImage: string | null
  /** 구매처 */
  purchasePlace: string
  purchaseUrl: string | null
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type TextbookInput = {
  title: string
  description?: string
  coverImage?: string | null
  purchasePlace?: string
  purchaseUrl?: string | null
  sortOrder?: number
  isPublished?: boolean
}