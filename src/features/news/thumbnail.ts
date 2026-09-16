import { assetUrl } from '../../api/client'
import { firstImageSrc } from '../../shared/richText'
import type { NewsPost } from './types'

/** Cover image if set, otherwise the first image inside the body, otherwise nothing. */
export function newsThumbnail(post: NewsPost): string | null {
  return post.coverImage ? assetUrl(post.coverImage) : firstImageSrc(post.body)
}
