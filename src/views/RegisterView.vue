<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()

const email = ref('')
const nickname = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const loading = ref(false)

async function onRegister() {
  if (!email.value || !nickname.value || !password.value || !passwordConfirm.value) return
  if (password.value.length < 8) { error.value = '비밀번호는 8자 이상이어야 합니다'; return }
  if (password.value !== passwordConfirm.value) { error.value = '비밀번호가 일치하지 않습니다'; return }

  loading.value = true
  error.value = ''
  try {
    await authApi.register({ email: email.value, nickname: nickname.value, password: password.value })
    router.push({ path: '/login', query: { registered: '1' } })
  } catch (e: any) {
    error.value = e.response?.data?.message ?? '회원가입에 실패했습니다'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas-soft dark:bg-dark-base flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-sm">

      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-ink dark:text-dark-text tracking-tight">회원가입</h1>
        <p class="text-sm text-ink-muted dark:text-dark-muted mt-1.5">Evervill에 오신 것을 환영합니다</p>
      </div>

      <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-8 shadow-sm">
        <form class="space-y-4" @submit.prevent="onRegister">
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">이메일</label>
            <input v-model="email" type="email" required placeholder="example@email.com"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">닉네임</label>
            <input v-model="nickname" type="text" required placeholder="사용할 닉네임 입력"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">비밀번호</label>
            <input v-model="password" type="password" required placeholder="8자 이상 입력"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">비밀번호 확인</label>
            <input v-model="passwordConfirm" type="password" required placeholder="비밀번호 재입력"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors" />
          </div>

          <p v-if="error" class="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
            {{ error }}
          </p>

          <BaseButton type="submit" :disabled="loading" class="w-full mt-2">
            {{ loading ? '가입 중...' : '회원가입' }}
          </BaseButton>
        </form>

        <p class="mt-5 text-center text-sm text-ink-faint dark:text-dark-muted">
          이미 계정이 있으신가요?
          <RouterLink to="/login" class="text-accent hover:underline font-medium">로그인</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
