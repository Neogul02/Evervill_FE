export type AnalysisType = 'PRICE' | 'REGISTRY'
export type RiskLevel = 'SAFE' | 'CAUTION' | 'DANGER'

export interface AiAnalysis {
  id: number
  analysisType: AnalysisType
  targetId: number | null
  fileUrl: string | null
  riskLevel: RiskLevel | null
  resultSummary: string | null
  createdAt: string
}
