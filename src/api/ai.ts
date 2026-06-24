import client, { userIdHeader } from './client'
import type { ApiResponse } from '@/types'
import type { AiAnalysis } from '@/types/ai'

export const aiApi = {
  // AI 응답은 시간이 오래 걸릴 수 있으므로 timeout을 0(무제한)으로 설정
  analyzePrice: (listingId: number) =>
    client.post<ApiResponse<AiAnalysis>>(`/api/ai/analyses/price/${listingId}`, undefined, {
      headers: userIdHeader(),
      timeout: 0,
    }),

  analyzeRegistry: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<ApiResponse<AiAnalysis>>('/api/ai/analyses/registry', form, {
      headers: { ...userIdHeader(), 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    })
  },

  getMyAnalyses: () =>
    client.get<ApiResponse<AiAnalysis[]>>('/api/ai/analyses', { headers: userIdHeader(), timeout: 0 }),
}
