export type MarketDealType = 'SALE' | 'JEONSE' | 'MONTHLY_RENT'
export type MarketPropertyType = 'MULTI_FAMILY' | 'OFFICETEL'

export interface MarketProperty {
  id: number
  districtCode: string
  districtName: string
  propertyName: string
  propertyType: MarketPropertyType
  dealType: MarketDealType
  dealAmount: number
  monthlyRent: number | null
  area: number | null
  floor: number | null
  buildYear: number | null
  dealYear: number
  dealMonth: number
  dealDay: number
}

export interface MarketFilter {
  districtCode?: string
  propertyType?: MarketPropertyType
  dealType?: MarketDealType
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  dealYear?: number
  dealMonth?: number
  keyword?: string
  page?: number
  size?: number
}

export interface MarketPageResponse {
  content: MarketProperty[]
  totalCount: number
  page: number
  size: number
  hasNext: boolean
}
