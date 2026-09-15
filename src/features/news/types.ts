export const NEWS_CATEGORIES = ['academic', 'events', 'campus', 'admissions'] as const
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export type NewsPost = {
  id: string
  title: string
  body: string
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
  category?: NewsCategory
  isPublished?: boolean
  isFeatured?: boolean
}
