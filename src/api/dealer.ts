import client from './client'
import type { ApiResponse, Dealer } from '@/types'

export const dealerApi = {
  // 공인중개사 목록 — 비로그인 허용
  getApprovedDealers: () =>
    client.get<ApiResponse<Dealer[]>>('/auth/dealers'),
}
