const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

function buildQueryString(params: Record<string, string | number | boolean | undefined | null>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.append(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  const contentType = response.headers.get('content-type')

  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return undefined as T
}

export async function apiGet<T>(endpoint: string, params: Record<string, string | number | boolean | undefined | null> = {}): Promise<T> {
  return apiRequest<T>(`${endpoint}${buildQueryString(params)}`)
}

export async function apiPost<T>(endpoint: string, body?: BodyInit | Record<string, unknown>): Promise<T> {
  const headers = body instanceof FormData ? undefined : { 'Content-Type': 'application/json' }
  const payload = body instanceof FormData ? body : JSON.stringify(body ?? {})

  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers,
    body: payload,
  })
}

export async function apiPatch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
  })
}
