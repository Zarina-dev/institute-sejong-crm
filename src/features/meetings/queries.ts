import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createMeeting, deleteMeeting, getMeetings, updateMeeting } from './api'
import type { MeetingInput } from './types'

export const meetingKeys = { all: ['meetings'] as const }

export function useMeetings() {
  return useQuery({ queryKey: meetingKeys.all, queryFn: getMeetings })
}

function useInvalidateMeetings() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: meetingKeys.all })
}

export function useCreateMeeting() {
  const invalidate = useInvalidateMeetings()
  return useMutation({ mutationFn: (payload: MeetingInput) => createMeeting(payload), onSuccess: invalidate })
}

export function useUpdateMeeting() {
  const invalidate = useInvalidateMeetings()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MeetingInput> }) => updateMeeting(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteMeeting() {
  const invalidate = useInvalidateMeetings()
  return useMutation({ mutationFn: (id: string) => deleteMeeting(id), onSuccess: invalidate })
}
