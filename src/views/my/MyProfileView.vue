<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores'
import { authApi } from '@/api'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const authStore = useAuthStore()

const nickname = ref(authStore.user?.nickname ?? '')
const nicknameLoading = ref(false)
const nicknameSuccess = ref(false)
const nicknameError = ref('')

const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

async function updateNickname() {
  if (!nickname.value.trim()) return
  nicknameLoading.value = true
  nicknameSuccess.value = false
  nicknameError.value = ''
  try {
    await authApi.updateProfile({ nickname: nickname.value.trim() })
    if (authStore.user) authStore.user.nickname = nickname.value.trim()
    nicknameSuccess.value = true
  } catch (e: any) {
    nicknameError.value = e.response?.data?.message ?? '닉네임 변경에 실패했습니다.'
  } finally {
    nicknameLoading.value = false
  }
}

async function updatePassword() {
  if (!currentPassword.value || !newPassword.value) return
  if (newPassword.value.length < 8) {
    passwordError.value = '새 비밀번호는 8자 이상이어야 합니다.'
    return
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    passwordError.value = '새 비밀번호가 일치하지 않습니다.'
    return
  }
  passwordLoading.value = true
  passwordSuccess.value = false
  passwordError.value = ''
  try {
    await authApi.updatePassword({ currentPassword: currentPassword.value, newPassword: newPassword.value })
    passwordSuccess.value = true
    currentPassword.value = ''
    newPassword.value = ''
    newPasswordConfirm.value = ''
  } catch (e: any) {
    passwordError.value = e.response?.data?.message ?? '비밀번호 변경에 실패했습니다.'
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />
    <main class="pt-14 max-w-lg mx-auto w-full px-4 py-8 space-y-6">

      <h1 class="text-xl font-bold text-ink dark:text-dark-text tracking-tight">프로필 설정</h1>

      <!-- 닉네임 변경 -->
      <section class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-6 space-y-4">
        <h2 class="text-sm font-semibold text-ink dark:text-dark-text">닉네임 변경</h2>

        <div>
          <label class="block text-xs font-medium text-ink-muted dark:text-dark-muted mb-1.5">닉네임</label>
          <input
            v-model="nickname"
            type="text"
            placeholder="새 닉네임 입력"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <p v-if="nicknameSuccess" class="text-xs text-green-600 dark:text-green-400">닉네임이 변경됐습니다.</p>
        <p v-if="nicknameError" class="text-xs text-red-500 dark:text-red-400">{{ nicknameError }}</p>

        <BaseButton :disabled="nicknameLoading || !nickname.trim()" @click="updateNickname">
          {{ nicknameLoading ? '변경 중...' : '닉네임 변경' }}
        </BaseButton>
      </section>

      <!-- 비밀번호 변경 -->
      <section class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-6 space-y-4">
        <h2 class="text-sm font-semibold text-ink dark:text-dark-text">비밀번호 변경</h2>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-ink-muted dark:text-dark-muted mb-1.5">현재 비밀번호</label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="현재 비밀번호"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-muted dark:text-dark-muted mb-1.5">새 비밀번호</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="새 비밀번호 (8자 이상)"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-muted dark:text-dark-muted mb-1.5">새 비밀번호 확인</label>
            <input
              v-model="newPasswordConfirm"
              type="password"
              placeholder="새 비밀번호 재입력"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <p v-if="passwordSuccess" class="text-xs text-green-600 dark:text-green-400">비밀번호가 변경됐습니다. 다음 로그인 시 적용됩니다.</p>
        <p v-if="passwordError" class="text-xs text-red-500 dark:text-red-400">{{ passwordError }}</p>

        <BaseButton
          :disabled="passwordLoading || !currentPassword || !newPassword || !newPasswordConfirm"
          @click="updatePassword"
        >{{ passwordLoading ? '변경 중...' : '비밀번호 변경' }}</BaseButton>
      </section>

    </main>
  </div>
</template>
