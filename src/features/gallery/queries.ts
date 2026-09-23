import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createAlbum, deleteAlbum, getAllAlbums, getPublishedAlbums, updateAlbum } from './api'
import type { AlbumInput } from './types'

export const galleryKeys = {
  all: ['gallery'] as const,
  published: () => [...galleryKeys.all, 'published'] as const,
  admin: () => [...galleryKeys.all, 'admin'] as const,
}

export function usePublishedAlbums() {
  return useQuery({ queryKey: galleryKeys.published(), queryFn: getPublishedAlbums, staleTime: 5 * 60_000 })
}

export function useAllAlbums() {
  return useQuery({ queryKey: galleryKeys.admin(), queryFn: getAllAlbums })
}

function useInvalidateGallery() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: galleryKeys.all })
}

export function useCreateAlbum() {
  const invalidate = useInvalidateGallery()
  return useMutation({ mutationFn: (payload: AlbumInput) => createAlbum(payload), onSuccess: invalidate })
}

export function useUpdateAlbum() {
  const invalidate = useInvalidateGallery()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AlbumInput> }) => updateAlbum(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteAlbum() {
  const invalidate = useInvalidateGallery()
  return useMutation({ mutationFn: (id: string) => deleteAlbum(id), onSuccess: invalidate })
}