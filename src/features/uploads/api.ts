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

export type UploadedDocument = UploadedImage & { name: string }

export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp'
export const MAX_DOCUMENT_SIZE = MAX_IMAGE_SIZE

/** `POST /uploads/documents` — TOPIK certificates and other student documents. */
export function uploadDocument(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost<UploadedDocument>('/uploads/documents', formData)
}