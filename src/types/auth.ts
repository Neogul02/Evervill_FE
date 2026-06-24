export type DealerStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface DealerProfile {
  realEstateLocation: string
  brokerRegistrationNumber: string
  businessRegistrationFileUrl: string
  brokerLicenseFileUrl: string
}

export interface User {
  id: number
  email: string
  nickname: string
  profileImageUrl?: string | null
  /** DEALER는 관리자 승인 후 부여됨 (요청 예정 — 현재 백엔드 미구현, dealer-matching-and-signup-role.md 참고) */
  role: 'USER' | 'ADMIN' | 'DEALER'
  /** 공인중개사 가입 심사 상태 (요청 예정 — 현재 백엔드 미구현) */
  dealerStatus?: DealerStatus
  /** dealerStatus가 NONE이 아닐 때만 존재 (요청 예정 — 현재 백엔드 미구현) */
  dealerProfile?: DealerProfile
  createdAt: string
  updatedAt: string
}

export interface PublicProfile {
  id: number
  email: string
  nickname: string
  profileImageUrl?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  /** 미입력 시 백엔드가 이메일 @ 앞부분으로 자동 설정 (요청 예정 — 현재 백엔드 미구현) */
  nickname?: string
  /** 선택 — 회원가입 시 프로필 이미지 (요청 예정 — 현재 백엔드 미구현) */
  profileImage?: File
  /** 기본값 USER. DEALER 선택 시 아래 4개 필드 필수 (요청 예정 — 현재 백엔드 미구현) */
  accountType?: 'USER' | 'DEALER'
  realEstateLocation?: string
  brokerRegistrationNumber?: string
  businessRegistrationFile?: File
  brokerLicenseFile?: File
}

export interface UpdateProfileRequest {
  nickname?: string
  profileImageUrl?: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

/** @deprecated 이전 타입 - TokenResponse 사용 */
export interface AuthResponse {
  token: string
  user: User
}
