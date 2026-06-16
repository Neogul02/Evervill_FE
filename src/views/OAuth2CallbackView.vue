<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { parseJwt } from '@/utils/jwt'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const accessToken = params.get('accessToken')
  const refreshToken = params.get('refreshToken')

  if (!accessToken) {
    router.replace('/login')
    return
  }

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }

  const userInfo = parseJwt(accessToken)
  if (userInfo) authStore.setAuth(accessToken, userInfo as any)
  else authStore.setToken(accessToken)

  router.replace('/')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-canvas-soft dark:bg-dark-base">
    <div class="flex flex-col items-center gap-4 text-ink-faint dark:text-dark-muted">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p class="text-sm">로그인 처리 중...</p>
    </div>
  </div>
</template>
