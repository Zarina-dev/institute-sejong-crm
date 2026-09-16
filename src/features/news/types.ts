export const NEWS_CATEGORIES = ['academic', 'events', 'campus', 'admissions'] as const
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export type NewsPost = {
  id: string
  title: string
  /** Sanitized HTML from the rich-text editor. */
  body: string
  /** Site-relative /uploads/images/… path or null. */
  coverImage: string | null
  category: NewsCategory
  isPublished: boolean
  isFeatured: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type NewsInput = {
  title: string
  body: string
  coverImage?: string | null
  category?: NewsCategory
  isPublished?: boolean
  isFeatured?: boolean
}
