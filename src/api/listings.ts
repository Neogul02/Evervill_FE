import client, { userIdHeader, dealerHeaders } from './client'
import type { Listing, CreateListingRequest, UpdateListingRequest, ListingFilter, ListingPageResponse, MyOfferedListing, ApiResponse, ListingOffer } from '@/types'

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

  // 딜러 역경매 — 복비 가격 제안 (DEALER, 재제안 시 덮어씀)
  submitOffer: (listingId: number, price: number) =>
    client.post<ApiResponse<string>>(`/api/listings/${listingId}/offers`, { price }, { headers: dealerHeaders() }),

  // 매물에 제안된 중개사 목록 (채팅방 매칭하기용)
  getOffers: (listingId: number) =>
    client.get<ApiResponse<ListingOffer[]>>(`/api/listings/${listingId}/offers`, { headers: userIdHeader() }),

  // 내가 제안한 매물 목록 (DEALER)
  getMyOfferedListings: () =>
    client.get<ApiResponse<MyOfferedListing[]>>('/api/listings/my-offers', { headers: dealerHeaders() }),
}
