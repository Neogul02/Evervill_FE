/** GET /auth/dealers — 매칭 모달에 노출되는 공인중개사 (비로그인 허용) */
export interface Dealer {
  id: number
  nickname: string
  profileImageUrl?: string | null
  businessName: string
  officeAddress: string
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
