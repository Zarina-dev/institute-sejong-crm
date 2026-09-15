import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '../api/client'

/**
 * One client for the whole app.
 *
 * - `staleTime` 30s: a page revisited within half a minute renders from cache
 *   instantly and refetches in the background, instead of flashing a spinner.
 * - No retry on 4xx: a 404 or a validation error will not fix itself; only
 *   network failures and 5xx get one retry.
 * - `refetchOnWindowFocus` off: the admin tables are edited in modals, and a
 *   refetch on every tab switch fights with in-progress edits.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }

        return failureCount < 1
      },
    },
    mutations: {
      retry: 0,
    },
  },
})
