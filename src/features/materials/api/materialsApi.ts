import { apiDelete, apiGet, apiPatch, apiPost } from '../../../api/client'
import type { MaterialListResponse } from '../../../types'
import type { MaterialsFilters } from '../types'

export async function getMaterials(filters: MaterialsFilters = {}) {
  return apiGet<MaterialListResponse>('/materials', filters)
}

export async function createMaterial(formData: FormData) {
  return apiPost<MaterialListResponse>('/materials', formData)
}

export async function updateMaterial(id: string, payload: Record<string, unknown>) {
  return apiPatch<MaterialListResponse>(`/materials/${id}`, payload)
}

export async function publishMaterial(id: string) {
  return apiPost<MaterialListResponse>(`/materials/${id}/publish`)
}

export async function unpublishMaterial(id: string) {
  return apiPost<MaterialListResponse>(`/materials/${id}/unpublish`)
}

export async function deleteMaterial(id: string) {
  return apiDelete<MaterialListResponse>(`/materials/${id}`)
}
