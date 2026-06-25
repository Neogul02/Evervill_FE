import client from './client'
import type { LoginRequest, RegisterRequest, RealtorRegisterRequest, UpdateProfileRequest, ApiResponse, TokenResponse, User, PublicProfile } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<ApiResponse<TokenResponse>>('/auth/login', data),

  reissue: (refreshToken: string) =>
    client.post<ApiResponse<TokenResponse>>('/auth/reissue', { refreshToken }),

  getMe: () =>
    client.get<ApiResponse<User>>('/auth/me'),

  getPublicProfile: (id: number) =>
    client.get<ApiResponse<PublicProfile>>(`/auth/users/${id}`),

  // 백엔드가 multipart(email/password/nickname?/profileImage?)를 받도록
  // 변경되는 것을 전제로 FormData로 전송한다 (요청 예정 — 현재 백엔드 미구현).
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

  // 공인중개사 가입 신청 — 파일 업로드 없음
  registerRealtor: (data: RealtorRegisterRequest) => {
    const form = new FormData()
    form.append('email', data.email)
    form.append('password', data.password)
    form.append('nickname', data.nickname)
    form.append('businessName', data.businessName)
    form.append('businessNumber', data.businessNumber)
    form.append('officeAddress', data.officeAddress)
    return client.post<ApiResponse<string>>('/auth/signup/realtor', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  logout: () =>
    client.post('/auth/logout'),

  updateProfile: (data: UpdateProfileRequest) =>
    client.patch<ApiResponse<User>>('/auth/me', data),

  uploadProfileImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<ApiResponse<string>>('/auth/me/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.patch<ApiResponse<void>>('/auth/me/password', data),
}
