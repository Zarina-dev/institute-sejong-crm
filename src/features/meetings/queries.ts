import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createMeeting, deleteMeeting, getMeeting, getMeetings, updateMeeting } from './api'
import type { MeetingInput } from './types'

export const meetingKeys = {
  all: ['meetings'] as const,
  list: () => [...meetingKeys.all, 'list'] as const,
  detail: (id: string) => [...meetingKeys.all, 'detail', id] as const,
}

export function useMeetings() {
  return useQuery({ queryKey: meetingKeys.list(), queryFn: getMeetings })
}

/** The open meeting, with its notes and decisions. */
export function useMeeting(id: string | null) {
  return useQuery({ queryKey: meetingKeys.detail(id ?? ''), queryFn: () => getMeeting(id!), enabled: Boolean(id) })
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
