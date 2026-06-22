import client from './client'
import type { ApiResponse } from '@/types'
import { useAuthStore } from '@/stores'

// API 게이트웨이가 JWT에서 X-User-Role을 자동으로 채워주므로
// 프론트에서는 X-User-Id만 보내면 된다 (백엔드 확인).
function adminHeaders() {
  return { 'X-User-Id': useAuthStore().user?.id }
}

export interface AdminNoticeRequest {
  title: string
  content: string
  noticeType: 'NOTICE' | 'EVENT'
  active: boolean
  startAt?: string
  endAt?: string
}

export interface AdminNoticeResponse {
  id: number
  title: string
  content: string
  noticeType: 'NOTICE' | 'EVENT'
  active: boolean
  startAt?: string
  endAt?: string
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
    client.get<ApiResponse<AdminNoticeResponse[]>>('/api/admin/notices', { headers: adminHeaders() }),
  createNotice: (data: AdminNoticeRequest) =>
    client.post<ApiResponse<AdminNoticeResponse>>('/api/admin/notices', data, { headers: adminHeaders() }),
  updateNotice: (id: number, data: Partial<AdminNoticeRequest & { isActive: boolean }>) =>
    client.put<ApiResponse<AdminNoticeResponse>>(`/api/admin/notices/${id}`, data, { headers: adminHeaders() }),
  deleteNotice: (id: number) =>
    client.delete<ApiResponse<void>>(`/api/admin/notices/${id}`, { headers: adminHeaders() }),

  // 신고
  getReports: (status?: string) =>
    client.get<ApiResponse<AdminReportResponse[]>>('/api/admin/reports', {
      params: status ? { status } : undefined,
      headers: adminHeaders(),
    }),
  updateReportStatus: (id: number, status: 'PROCESSED' | 'DISMISSED') =>
    client.put<ApiResponse<void>>(`/api/admin/reports/${id}/status`, { status }, { headers: adminHeaders() }),

  // 배치
  triggerMarketBatch: (yearMonth: string) =>
    client.post<ApiResponse<void>>(`/api/admin/batch/market`, null, { params: { yearMonth }, headers: adminHeaders() }),

  // 매물 강제삭제
  deleteListing: (id: number) =>
    client.delete<ApiResponse<void>>(`/api/admin/listings/${id}`, { headers: adminHeaders() }),
}
