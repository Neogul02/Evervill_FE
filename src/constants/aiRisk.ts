import type { BadgeTone } from './dealTypeColors'
import type { RiskLevel } from '@/types/ai'

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  SAFE: '안전',
  CAUTION: '주의',
  DANGER: '위험',
}

export const RISK_LEVEL_TONE: Record<RiskLevel, BadgeTone> = {
  SAFE: 'green',
  CAUTION: 'amber',
  DANGER: 'rose',
}
