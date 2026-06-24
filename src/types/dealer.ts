import type { DealerStatus } from './auth'

/** 매칭 모달에 노출되는 승인된 공인중개사 (요청 예정 — 현재 백엔드 미구현) */
export interface Dealer {
  id: number
  nickname: string
  profileImageUrl?: string | null
  realEstateLocation: string
}

/** 관리자 승인 탭의 가입 신청 항목 (요청 예정 — 현재 백엔드 미구현) */
export interface DealerApplication {
  id: number
  nickname: string
  email: string
  realEstateLocation: string
  brokerRegistrationNumber: string
  businessRegistrationFileUrl: string
  brokerLicenseFileUrl: string
  dealerStatus: DealerStatus
  createdAt: string
}
