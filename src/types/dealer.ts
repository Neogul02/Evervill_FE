/** GET /api/listings/{listingId}/offers — 매물에 제안된 중개사 가격 제안 (딜러 역경매) */
export interface ListingOffer {
  id: number
  dealerId: number
  price: number
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED'
  createdAt: string
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
