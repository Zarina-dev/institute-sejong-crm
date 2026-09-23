import { apiPost } from '../../api/client'

export type UploadedImage = {
  /** Site-relative path (`/uploads/images/…`); resolve with `assetUrl()` for display. */
  url: string
  size: number
  type: string
}

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/** `POST /uploads/images` — shared by the rich-text editor, news covers and staff photos. */
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost<UploadedImage>('/uploads/images', formData)
}
