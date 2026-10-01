import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createEvent, deleteEvent, getAllEvents, getEvents, updateEvent } from './api'
import type { ScheduleEventInput } from './types'

export const eventKeys = {
  all: ['events'] as const,
  published: () => [...eventKeys.all, 'published'] as const,
  admin: () => [...eventKeys.all, 'admin'] as const,
}

export function useEvents() {
  return useQuery({ queryKey: eventKeys.published(), queryFn: getEvents, staleTime: 5 * 60_000 })
}

export function useAllEvents() {
  return useQuery({ queryKey: eventKeys.admin(), queryFn: getAllEvents })
}

function useInvalidateEvents() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: eventKeys.all })
}

export function useCreateEvent() {
  const invalidate = useInvalidateEvents()
  return useMutation({ mutationFn: (payload: ScheduleEventInput) => createEvent(payload), onSuccess: invalidate })
}

export function useUpdateEvent() {
  const invalidate = useInvalidateEvents()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ScheduleEventInput> }) => updateEvent(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteEvent() {
  const invalidate = useInvalidateEvents()
  return useMutation({ mutationFn: (id: string) => deleteEvent(id), onSuccess: invalidate })
}
