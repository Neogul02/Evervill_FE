import type { DealType, ListingStatus } from '@/types/listing'
import type { MarketPropertyType } from '@/types/market'

export type BadgeTone = 'green' | 'sky' | 'amber' | 'rose' | 'violet' | 'neutral'

export const DEAL_TYPE_TONE: Record<DealType, BadgeTone> = {
  SALE: 'violet',
  JEONSE: 'sky',
  MONTHLY_RENT: 'amber',
}

export const STATUS_TONE: Record<ListingStatus, BadgeTone> = {
  ACTIVE: 'green',
  RESERVED: 'amber',
  CLOSED: 'neutral',
}

export const PROPERTY_TYPE_TONE: Record<MarketPropertyType, BadgeTone> = {
  MULTI_FAMILY: 'rose',
  OFFICETEL: 'sky',
}
