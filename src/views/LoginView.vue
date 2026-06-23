<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '@/api'
import { useAuthStore } from '@/stores'
import { parseJwt } from '@/utils/jwt'
import kakaoLoginImg from '@/assets/kakao_login_large_wide.png'
import naverLoginImg from '@/assets/NAVER_login_Dark_wide_H56.png'
import logoImg from '@/assets/evervill_logo.png'
import logoWhiteImg from '@/assets/evervill_logo_white.png'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isDark } = useTheme()

// Vercel 프로덕션: 게이트웨이 절대 URL 필요 (.env.production에 설정)
// 로컬 개발: 빈 문자열 → Vite 프록시가 상대 경로를 게이트웨이로 포워딩
const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || ''

const registered = route.query.registered === '1'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onLogin() {
  if (!email.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.login({ email: email.value, password: password.value })
    const { accessToken, refreshToken } = res.data.data
    const userInfo = parseJwt(accessToken)
    if (userInfo) authStore.setAuth(accessToken, userInfo as any)
    else authStore.setToken(accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? '로그인에 실패했습니다'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas-soft dark:bg-dark-base flex items-center justify-center px-4">
    <div class="w-full max-w-sm">

      <!-- 헤더 -->
      <div class="text-center mb-8">
        <img
          :src="isDark ? logoWhiteImg : logoImg"
          alt="Evervill"
          class="h-10 w-auto object-contain mx-auto"
          draggable="false"
        />
        <p class="text-sm text-ink-muted dark:text-dark-muted mt-1.5">부동산 직거래 플랫폼</p>
      </div>

      <!-- 카드 -->
      <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-8 shadow-sm">

        <p v-if="registered" class="mb-5 text-sm text-accent bg-accent-light dark:bg-accent-dark-muted px-4 py-2.5 rounded-lg text-center">
          회원가입이 완료됐습니다. 로그인해주세요!
        </p>

        <form class="space-y-4" @submit.prevent="onLogin">
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">이메일</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="example@email.com"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent dark:focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">비밀번호</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="비밀번호 입력"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent dark:focus:border-accent transition-colors"
            />
          </div>

          <p v-if="error" class="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
            {{ error }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded-full text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer active:scale-[0.98] shadow-sm mt-2"
          >
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <div class="mt-5 pt-5 border-t border-hairline dark:border-dark-border space-y-2.5">
          <a
            :href="`${gatewayUrl}/oauth2/authorization/kakao`"
            class="block w-full transition-all active:scale-[0.98] rounded-lg overflow-hidden hover:opacity-90"
          >
            <img :src="kakaoLoginImg" alt="카카오로 로그인" class="w-full" />
          </a>

          <a
            :href="`${gatewayUrl}/oauth2/authorization/naver`"
            class="block w-full transition-all active:scale-[0.98] rounded-lg overflow-hidden hover:opacity-90"
          >
            <img :src="naverLoginImg" alt="네이버로 로그인" class="w-full" />
          </a>
        </div>

        <p class="mt-5 text-center text-sm text-ink-faint dark:text-dark-muted">
          계정이 없으신가요?
          <RouterLink to="/register" class="text-accent hover:underline font-medium">회원가입</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
