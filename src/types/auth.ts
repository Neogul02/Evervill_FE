export interface User {
  id: number
  email: string
  nickname: string
  profileImageUrl?: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
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
}

export interface UpdateProfileRequest {
  nickname?: string
  profileImage?: File
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
