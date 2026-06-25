import type { MarketProperty } from './market'

export type DealType = 'SALE' | 'JEONSE' | 'MONTHLY_RENT'
export type ListingStatus = 'ACTIVE' | 'RESERVED' | 'CLOSED'

export interface ListingImage {
  id: number
  imageUrl: string
  sortOrder: number
}

export interface Listing {
  id: number
  sellerId: number
  sellerNickname?: string | null
  title: string
  description: string | null
  dealType: DealType
  price: number
  monthlyRent: number
  area: number | null
  floor: number | null
  address: string
  addressDetail: string | null
  latitude: number | null
  longitude: number | null
  status: ListingStatus
  viewCount: number
  bookmarked?: boolean
  bookmarkCount: number
  images: ListingImage[]
  nearbyMarketPrices: MarketProperty[] | null
  createdAt: string
}

/** GET /api/listings/my-offers — 딜러가 제안한 매물 (조회수/북마크 수 등은 응답에 없음) */
export interface MyOfferedListing {
  id: number
  sellerId: number
  title: string
  dealType: DealType
  price: number
  monthlyRent: number
  area: number | null
  floor: number | null
  address: string
  addressDetail: string | null
  status: ListingStatus
  images: ListingImage[]
  createdAt: string
  myOfferPrice: number
}

// BE 응답의 페이지네이션 형식 (hasNext 방식)
export interface ListingPageResponse<T> {
  content: T[]
  totalCount: number
  page: number
  size: number
  hasNext: boolean
}

export interface ListingFilter {
  dealType?: DealType
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  year?: number
  month?: number
  address?: string
  keyword?: string
  page?: number
  size?: number
}

export interface CreateListingRequest {
  title: string
  description?: string
  dealType: DealType
  price: number
  monthlyRent?: number
  area?: number
  floor?: number
  address: string
  addressDetail?: string
  latitude?: number
  longitude?: number
}

export interface UpdateListingRequest {
  title?: string
  description?: string
  dealType?: DealType
  price?: number
  monthlyRent?: number
  area?: number
  floor?: number
  address?: string
  addressDetail?: string
  status?: ListingStatus
}
