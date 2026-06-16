import client from './client'
import type { ApiResponse } from '@/types'

export interface AdminNoticeRequest {
  title: string
  content: string
  type: 'NOTICE' | 'EVENT'
}

export interface AdminNoticeResponse {
  id: number
  title: string
  content: string
  type: 'NOTICE' | 'EVENT'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminReportResponse {
  id: number
  listingId: number
  listingTitle: string
  reporterId: number
  reason: string
  status: 'PENDING' | 'PROCESSED' | 'DISMISSED'
  createdAt: string
}

export const adminApi = {
  // 공지
  getNotices: () =>
    client.get<ApiResponse<AdminNoticeResponse[]>>('/api/admin/notices'),
  createNotice: (data: AdminNoticeRequest) =>
    client.post<ApiResponse<AdminNoticeResponse>>('/api/admin/notices', data),
  updateNotice: (id: number, data: Partial<AdminNoticeRequest & { isActive: boolean }>) =>
    client.put<ApiResponse<AdminNoticeResponse>>(`/api/admin/notices/${id}`, data),
  deleteNotice: (id: number) =>
    client.delete<ApiResponse<void>>(`/api/admin/notices/${id}`),

  // 신고
  getReports: (status?: string) =>
    client.get<ApiResponse<AdminReportResponse[]>>('/api/admin/reports', { params: status ? { status } : undefined }),
  updateReportStatus: (id: number, status: 'PROCESSED' | 'DISMISSED') =>
    client.put<ApiResponse<void>>(`/api/admin/reports/${id}/status`, { status }),

  // 배치
  triggerMarketBatch: (yearMonth: string) =>
    client.post<ApiResponse<void>>(`/api/admin/batch/market`, null, { params: { yearMonth } }),

  // 매물 강제삭제
  deleteListing: (id: number) =>
    client.delete<ApiResponse<void>>(`/api/admin/listings/${id}`),
}
