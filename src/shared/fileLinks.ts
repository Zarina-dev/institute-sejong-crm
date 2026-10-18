import { assetUrl, authedUrl } from '../api/client'

/** A stored file: its site-relative path and the name it had on the admin's machine. */
export type PreviewFile = { url: string; name: string }

/**
 * 회의록 attachments are not public files: the API hands them to the admin
 * only, with the token in the query since an iframe or a link sends no
 * header. Anything else stored by the API is a plain asset.
 */
export const fileSource = (url: string) => (url.startsWith('/uploads/documents/') ? authedUrl(url) : assetUrl(url))

/**
 * The same file as a download under its original name — the API names it, as
 * a cross-origin <a download> cannot. Resolved against the page, since the API
 * address may be relative (`/api`, when site and API share one origin).
 */
export function fileDownloadUrl(file: PreviewFile) {
  const link = new URL(fileSource(file.url), window.location.origin)
  link.searchParams.set('name', file.name)
  return link.toString()
}
