import type { DealType, Listing } from '@/types'

export function formatManWon(value: number | null | undefined): string {
  if (value == null) return '-'
  if (value >= 10000) {
    const uk = Math.floor(value / 10000)
    const man = value % 10000
    if (man === 0) return `${uk}억`
    return `${uk}억 ${man.toLocaleString()}만`
  }
  return `${value.toLocaleString()}만`
}

export function formatListingPrice(listing: Listing): string {
  switch (listing.dealType) {
    case 'SALE':
      return `매매 ${formatManWon(listing.price)}`
    case 'JEONSE':
      return `전세 ${formatManWon(listing.price)}`
    case 'MONTHLY_RENT':
      return `월세 ${formatManWon(listing.price)} / 월 ${listing.monthlyRent?.toLocaleString() ?? '-'}만`
    default:
      return '-'
  }
}

export function formatArea(area: number | null | undefined): string {
  if (area == null) return '-'
  return `${area}m²`
}

export function formatFloor(floor: number | null | undefined): string {
  if (floor == null) return '-'
  return `${floor}층`
}

export const DEAL_TYPE_LABEL: Record<DealType, string> = {
  SALE: '매매',
  JEONSE: '전세',
  MONTHLY_RENT: '월세',
}

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '거래 가능',
  RESERVED: '예약 중',
  CLOSED: '거래 완료',
}

export const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  RESERVED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  CLOSED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}
