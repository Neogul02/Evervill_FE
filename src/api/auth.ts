import client from './client'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, ApiResponse, TokenResponse } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ApiResponse<TokenResponse>>('/auth/login', data),

  // 백엔드가 multipart(email/password/nickname?/profileImage?)를 받도록 변경되는 것을
  // 전제로 FormData로 전송한다 (요청 예정 — 현재 백엔드는 JSON @RequestBody만 받음).
  register: (data: RegisterRequest) => {
    const form = new FormData()
    form.append('email', data.email)
    form.append('password', data.password)
    if (data.nickname) form.append('nickname', data.nickname)
    if (data.profileImage) form.append('profileImage', data.profileImage)
    return client.post<ApiResponse<string>>('/auth/signup', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  logout: () =>
    client.post('/auth/logout'),

  // PATCH /auth/profile 자체가 아직 백엔드에 없음 (요청 예정)
  updateProfile: (data: UpdateProfileRequest) => {
    const form = new FormData()
    if (data.nickname) form.append('nickname', data.nickname)
    if (data.profileImage) form.append('profileImage', data.profileImage)
    return client.patch<ApiResponse<void>>('/auth/profile', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.patch<ApiResponse<void>>('/auth/password', data),

  deleteAccount: (data: { password: string }) =>
    client.delete<ApiResponse<void>>('/auth/account', { data }),
}
