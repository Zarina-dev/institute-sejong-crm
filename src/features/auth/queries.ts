import { useMutation } from '@tanstack/react-query'

import { login } from './api'

/** Login is a mutation: it has side effects and must never be cached. */
export function useLogin() {
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => login(username, password),
  })
}