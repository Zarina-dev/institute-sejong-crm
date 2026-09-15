import { ApiError } from '../api/client'

/** Human-readable text for whatever a query or mutation rejected with. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}
