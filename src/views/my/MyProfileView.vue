<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { authApi } from '@/api'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
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

const withdrawPassword = ref('')
const withdrawLoading = ref(false)
const withdrawError = ref('')

async function withdraw() {
  if (!withdrawPassword.value) return
  if (!confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
  withdrawLoading.value = true
  withdrawError.value = ''
  try {
    await authApi.deleteAccount({ password: withdrawPassword.value })
    authStore.logout()
    router.push('/')
  } catch (e: any) {
    withdrawError.value = e.response?.data?.message ?? '회원탈퇴에 실패했습니다.'
  } finally {
    withdrawLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />
    <main class="pt-14 max-w-lg mx-auto w-full px-4 py-8 space-y-6">

      <h1 class="text-xl font-bold text-ink dark:text-dark-text tracking-tight">프로필 설정</h1>

      <!-- 계정 정보 -->
      <section class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-6 space-y-3">
        <h2 class="text-sm font-semibold text-ink dark:text-dark-text">계정 정보</h2>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-xs text-ink-faint dark:text-dark-muted mb-0.5">닉네임</p>
            <p class="font-semibold text-ink dark:text-dark-text">{{ authStore.user?.nickname }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-faint dark:text-dark-muted mb-0.5">이메일</p>
            <p class="font-semibold text-ink dark:text-dark-text">{{ authStore.user?.email }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-faint dark:text-dark-muted mb-0.5">가입일</p>
            <p class="font-semibold text-ink dark:text-dark-text">{{ authStore.user?.createdAt ? new Date(authStore.user.createdAt).toLocaleDateString('ko-KR') : '-' }}</p>
          </div>
        </div>
      </section>

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

      <!-- 회원탈퇴 -->
      <section class="bg-canvas dark:bg-dark-surface rounded-xl border border-red-300 dark:border-red-900/50 p-6 space-y-4">
        <div>
          <h2 class="text-sm font-semibold text-red-500 dark:text-red-400">회원탈퇴</h2>
          <p class="text-xs text-ink-faint dark:text-dark-muted mt-1">탈퇴 시 계정 정보는 복구할 수 없습니다.</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-muted dark:text-dark-muted mb-1.5">비밀번호 확인</label>
          <input
            v-model="withdrawPassword"
            type="password"
            placeholder="현재 비밀번호 입력"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-red-400 transition-colors"
          />
        </div>

        <p v-if="withdrawError" class="text-xs text-red-500 dark:text-red-400">{{ withdrawError }}</p>

        <button
          :disabled="withdrawLoading || !withdrawPassword"
          @click="withdraw"
          class="py-2 px-4 border border-red-400 text-red-500 rounded-full text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 cursor-pointer"
        >{{ withdrawLoading ? '처리 중...' : '회원탈퇴' }}</button>
      </section>

    </main>
  </div>
</template>
