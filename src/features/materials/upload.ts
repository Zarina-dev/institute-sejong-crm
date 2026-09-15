/**
 * Client-side mirror of backend/src/materials/upload.config.ts. The server is
 * the authority; this exists so a wrong file is refused before the request,
 * with a message, instead of after a full upload.
 */
export const ALLOWED_MATERIAL_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'hwp', 'hwpx', 'txt', 'zip', 'jpg', 'jpeg', 'png', 'mp4', 'webm',
] as const

export const MAX_MATERIAL_FILE_SIZE = 10 * 1024 * 1024

/** Value for `<Upload accept>` / `<input accept>`. */
export const MATERIAL_ACCEPT = ALLOWED_MATERIAL_EXTENSIONS.map((ext) => `.${ext}`).join(',')

export type UploadRejection = { reason: 'type'; ext: string } | { reason: 'size'; size: number }

export function validateMaterialFile(file: File): UploadRejection | null {
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''

  if (!(ALLOWED_MATERIAL_EXTENSIONS as readonly string[]).includes(ext)) {
    return { reason: 'type', ext }
  }

  if (file.size > MAX_MATERIAL_FILE_SIZE) {
    return { reason: 'size', size: file.size }
  }

  return null
}
