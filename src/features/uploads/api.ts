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

export type UploadedVideo = UploadedImage

export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v'
/** Kept in step with the API (MAX_VIDEO_SIZE). */
export const MAX_VIDEO_SIZE = 300 * 1024 * 1024

/** `POST /uploads/videos` — stored in R2 when the API is configured for it. */
export function uploadVideo(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost<UploadedVideo>('/uploads/videos', formData)
}

export type UploadedDocument = {
  /** Site-relative path (`/uploads/documents/…`). */
  url: string
  /** The name the file had on the admin's machine. */
  name: string
  size: number
  type: string
}

/** Attachments for 회의록 — .hwp and .hwpx included; kept in step with the API. */
export const DOCUMENT_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.hwpx,.txt,.csv,.zip,.jpg,.jpeg,.png'
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024

/** `POST /uploads/documents` — admin only, like the image route. */
export function uploadDocument(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost<UploadedDocument>('/uploads/documents', formData)
}
