/**
 * Thin fetch wrapper for the NestJS API.
 *
 * The base URL comes from `VITE_API_BASE_URL` (see .env.example); the
 * localhost fallback exists so `npm run dev` works with no .env at all.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

type QueryValue = string | number | boolean | undefined | null
type QueryParams = Record<string, QueryValue>

/** Absolute URL for an API endpoint — for `<a href>` / downloads, not fetch. */
export function apiUrl(endpoint: string) {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
}

function buildQueryString(params: QueryParams) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    searchParams.append(key, String(value))
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Nest's exception filter answers with `{ statusCode, message, error }`, where
 * `message` is a string or — for validation failures — an array of strings.
 * Surface that instead of the raw JSON body so the UI can show it as-is.
 */
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed: ${response.status}`
  const text = await response.text().catch(() => '')

  if (!text) {
    return fallback
  }

  try {
    const body = JSON.parse(text) as { message?: string | string[] }

    if (Array.isArray(body.message)) {
      return body.message.join('\n')
    }

    return body.message || fallback
  } catch {
    return text
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(endpoint), options)

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return undefined as T
}

export function apiGet<T>(endpoint: string, params: QueryParams = {}): Promise<T> {
  return apiRequest<T>(`${endpoint}${buildQueryString(params)}`)
}

export function apiPost<T>(endpoint: string, body?: BodyInit | Record<string, unknown>): Promise<T> {
  // FormData sets its own multipart boundary — never override its content type.
  const isFormData = body instanceof FormData

  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? body : JSON.stringify(body ?? {}),
  })
}

export function apiPatch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}
