import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { parseJwt } from '@/utils/jwt'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  // 새로고침 시 user가 사라지면 X-User-Id/X-User-Role 등 인증 헤더가 비어 백엔드가 500을 내므로,
  // 저장된 토큰이 있으면 즉시 디코드해 user를 복원한다.
  const user = ref<User | null>(token.value ? (parseJwt(token.value) as User) : null)

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
  }

  function setToken(newToken: string) {
    token.value = newToken
    user.value = parseJwt(newToken) as User | null
    localStorage.setItem('token', newToken)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }

  return { token, user, isAuthenticated, setAuth, setToken, logout }
})
