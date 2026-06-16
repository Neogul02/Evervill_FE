import client from './client'
import type { AiAnalysis, PriceAnalysisRequest, RegistryAnalysisRequest } from '@/types'

export const aiApi = {
  analyzePrice: (data: PriceAnalysisRequest) =>
    client.post<AiAnalysis>('/api/ai/price', data),

  analyzeRegistry: (data: RegistryAnalysisRequest) =>
    client.post<AiAnalysis>('/api/ai/registry', data),

  getHistory: () =>
    client.get<AiAnalysis[]>('/api/ai/history'),

  getById: (id: number) =>
    client.get<AiAnalysis>(`/api/ai/${id}`),
}
