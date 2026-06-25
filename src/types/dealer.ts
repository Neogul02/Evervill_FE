/** 매칭 모달에 노출되는 승인된 공인중개사 (요청 예정 — 현재 백엔드 미구현) */
export interface Dealer {
  id: number
  nickname: string
  profileImageUrl?: string | null
  realEstateLocation: string
}

export type RealtorApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** GET /auth/admin/realtor-applications — 공인중개사 가입 신청 항목 */
export interface RealtorApplication {
  id: number
  userId: number
  businessName: string
  businessNumber: string
  officeAddress: string
  licenseImageUrl: string
  status: RealtorApplicationStatus
  createdAt: string
}
