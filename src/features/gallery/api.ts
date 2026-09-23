import { apiDelete, apiGet, apiPatch, apiPost } from '../../api/client'
import type { AlbumInput, GalleryAlbum } from './types'

export const getPublishedAlbums = () => apiGet<GalleryAlbum[]>('/gallery')
export const getAllAlbums = () => apiGet<GalleryAlbum[]>('/gallery', { all: true })
export const createAlbum = (payload: AlbumInput) => apiPost<GalleryAlbum>('/gallery', payload)
export const updateAlbum = (id: string, payload: Partial<AlbumInput>) => apiPatch<GalleryAlbum>(`/gallery/${id}`, payload)
export const deleteAlbum = (id: string) => apiDelete<{ success: boolean }>(`/gallery/${id}`)