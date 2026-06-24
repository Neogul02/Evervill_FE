import client, { userIdHeader } from './client'
import type { ApiResponse, Dealer } from '@/types'

// 요청 예정 — 현재 백엔드 미구현 (dealer-matching-and-signup-role.md 참고)
export const dealerApi = {
  getApprovedDealers: () =>
    client.get<ApiResponse<Dealer[]>>('/api/dealers', { headers: userIdHeader() }),
}
