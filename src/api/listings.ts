import client, { userIdHeader } from './client'
import type { Listing, CreateListingRequest, UpdateListingRequest, ListingFilter, ListingPageResponse } from '@/types'
import type { ApiResponse } from '@/types'

export const listingsApi = {
  getList: (params?: ListingFilter) =>
    client.get<ApiResponse<ListingPageResponse<Listing>>>('/api/listings', { params }),

  getMy: (params?: ListingFilter) =>
    client.get<ApiResponse<ListingPageResponse<Listing>>>('/api/listings/my', { params, headers: userIdHeader() }),

  getById: (id: number) =>
    client.get<ApiResponse<Listing>>(`/api/listings/${id}`, { headers: userIdHeader() }),

  create: (data: CreateListingRequest) =>
    client.post<ApiResponse<Listing>>('/api/listings', data),

  update: (id: number, data: UpdateListingRequest) =>
    client.put<ApiResponse<Listing>>(`/api/listings/${id}`, data),

  delete: (id: number) =>
    client.delete<ApiResponse<void>>(`/api/listings/${id}`),

  uploadImage: (id: number, file: File, sortOrder = 0) => {
    const form = new FormData()
    form.append('file', file)
    form.append('sortOrder', String(sortOrder))
    return client.post<ApiResponse<{ id: number; imageUrl: string; sortOrder: number }>>(
      `/api/listings/${id}/images`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  deleteImage: (id: number, imageId: number) =>
    client.delete<ApiResponse<void>>(`/api/listings/${id}/images/${imageId}`),

  bookmark: (id: number) =>
    client.post<ApiResponse<void>>(`/api/listings/${id}/bookmark`),

  unbookmark: (id: number) =>
    client.delete<ApiResponse<void>>(`/api/listings/${id}/bookmark`),

  getBookmarks: () =>
    client.get<ApiResponse<Listing[]>>('/api/listings/bookmarks', { headers: userIdHeader() }),

  getRecent: () =>
    client.get<ApiResponse<Listing[]>>('/api/listings/recent', { headers: userIdHeader() }),

  report: (id: number, reason: string) =>
    client.post<ApiResponse<void>>(`/api/listings/${id}/report`, { reason }, { headers: userIdHeader() }),
}
