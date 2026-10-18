import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { StaffRole } from '../../auth/session'
import { createAccount, deleteAccount, getAccounts, resetAccountPassword, setAccountStatus, updateAccount, type AccountsQuery } from './api'
import type { StaffAccountInput } from './types'

const accountKeys = { all: ['accounts'] as const, page: (query: AccountsQuery) => ['accounts', query] as const }

/** One page of accounts; the previous page stays on screen while the next loads. */
export function useAccounts(query: AccountsQuery) {
  return useQuery({
    queryKey: accountKeys.page(query),
    queryFn: ({ signal }) => getAccounts(query, signal),
    placeholderData: keepPreviousData,
  })
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient()
  // The signed-in account may be among the changed ones (its name).
  return () => {
    queryClient.invalidateQueries({ queryKey: accountKeys.all })
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({ mutationFn: (payload: StaffAccountInput) => createAccount(payload), onSuccess: invalidate })
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { fullName?: string; role?: StaffRole } }) => updateAccount(id, payload),
    onSuccess: invalidate,
  })
}

export function useResetAccountPassword() {
  return useMutation({ mutationFn: ({ id, password }: { id: string; password: string }) => resetAccountPassword(id, password) })
}

export function useSetAccountStatus() {
  const invalidate = useInvalidateAccounts()
  return useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setAccountStatus(id, isActive), onSuccess: invalidate })
}

export function useDeleteAccount() {
  const invalidate = useInvalidateAccounts()
  return useMutation({ mutationFn: (id: string) => deleteAccount(id), onSuccess: invalidate })
}
