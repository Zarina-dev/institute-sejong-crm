import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { clearSession, getSession, setSession, updateSessionUser } from '../../auth/session'
import { changeOwnPassword, getMe, login, logout } from './api'

/** Login is a mutation: it has side effects and must never be cached. */
export function useLogin() {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => login(username, password),
  })
}

/**
 * The signed-in account, read again from the API when the admin panel
 * opens and whenever its window regains focus: a renamed account or a
 * changed role shows up without signing in again, and a deactivated one
 * gets a 401, which signs the tab out (api/client.ts).
 */
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const me = await getMe()
      updateSessionUser(me)
      return me
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  })
}

/**
 * Signs out: the server ends the account's sessions, then this tab (and,
 * over the BroadcastChannel, every other tab) forgets the token. A failed
 * request still signs out locally — the token is gone from the browser
 * either way, and it expires by itself.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        // Signed out locally all the same (see above).
      } finally {
        clearSession()
        queryClient.removeQueries({ queryKey: ['auth'] })
        queryClient.removeQueries({ queryKey: ['accounts'] })
      }
    },
  })
}

/** Keeps this tab signed in with the fresh token the API hands back. */
export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, password }: { currentPassword: string; password: string }) => {
      const session = getSession()
      if (!session) throw new Error('Not signed in')
      const result = await changeOwnPassword(session.id, currentPassword, password)
      setSession({ ...result.user, token: result.token })
      return result
    },
  })
}
