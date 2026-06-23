import client, { userIdHeader } from './client'
import type { ApiResponse } from '@/types'
import type { AiAnalysis } from '@/types/ai'

export const aiApi = {
  analyzePrice: (listingId: number) =>
    client.post<ApiResponse<AiAnalysis>>(`/api/ai/analyses/price/${listingId}`, undefined, {
      headers: userIdHeader(),
    }),

  analyzeRegistry: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<ApiResponse<AiAnalysis>>('/api/ai/analyses/registry', form, {
      headers: { ...userIdHeader(), 'Content-Type': 'multipart/form-data' },
    })
  },

  getMyAnalyses: () =>
    client.get<ApiResponse<AiAnalysis[]>>('/api/ai/analyses', { headers: userIdHeader() }),
}
