import type { SyntheticEvent } from 'react'

import { assetUrl, storedMediaPath, thumbnailUrl } from '../api/client'

/**
 * `src` and `onError` for an <img> showing an uploaded photo small: its
 * thumbnail, and the original instead if the thumbnail is not there (a
 * photo from before thumbnails, until `npm run images:thumbs` has run).
 */
export function thumbnailProps(path: string) {
  const original = assetUrl(path)
  return {
    src: thumbnailUrl(path),
    onError: (event: SyntheticEvent<HTMLImageElement>) => {
      const img = event.currentTarget
      if (img.src !== original) img.src = original
    },
  }
}

/** The same for an absolute address (an image inside a post's HTML); one not ours stays as it is. */
export function thumbnailPropsForUrl(url: string) {
  const path = storedMediaPath(url)
  return path ? thumbnailProps(path) : { src: url }
}
