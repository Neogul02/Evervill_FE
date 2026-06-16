export type AnalysisType = 'PRICE' | 'REGISTRY'
export type ResultLevel = 'SAFE' | 'CAUTION' | 'DANGER'

export interface AiAnalysis {
  id: number
  userId: number
  analysisType: AnalysisType
  targetId: number | null
  fileUrl: string | null
  resultLevel: ResultLevel | null
  summary: string | null
  createdAt: string
}

export interface PriceAnalysisRequest {
  targetId: number
}

export interface RegistryAnalysisRequest {
  targetId?: number
  fileUrl: string
}
