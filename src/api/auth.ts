import client from './client'
import type { LoginRequest, RegisterRequest, ApiResponse, TokenResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ApiResponse<TokenResponse>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    client.post<ApiResponse<string>>('/auth/signup', data),

  logout: () =>
    client.post('/auth/logout'),

  updateProfile: (data: { nickname: string }) =>
    client.patch<ApiResponse<void>>('/auth/profile', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.patch<ApiResponse<void>>('/auth/password', data),
}
