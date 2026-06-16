export interface User {
  id: number
  email: string
  nickname: string
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
  nickname: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** @deprecated 이전 타입 - TokenResponse 사용 */
export interface AuthResponse {
  token: string
  user: User
}
