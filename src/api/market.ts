import client from './client'
import type { MarketProperty, MarketFilter, MarketPageResponse } from '@/types'
import type { ApiResponse } from '@/types'

export const marketApi = {
  getList: (params?: MarketFilter) =>
    client.get<ApiResponse<MarketPageResponse>>('/api/market', { params }),

  getById: (id: number) =>
    client.get<ApiResponse<MarketProperty>>(`/api/market/${id}`),

  bookmark: (id: number) =>
    client.post<ApiResponse<void>>(`/api/market/${id}/bookmark`),

  unbookmark: (id: number) =>
    client.delete<ApiResponse<void>>(`/api/market/${id}/bookmark`),

  getBookmarks: () =>
    client.get<ApiResponse<MarketProperty[]>>('/api/market/bookmarks'),
}
