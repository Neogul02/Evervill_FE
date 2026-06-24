<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores'
import { authApi } from '@/api'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const authStore = useAuthStore()

const nickname = ref(authStore.user?.nickname ?? '')
const nicknameLoading = ref(false)
const nicknameSuccess = ref(false)
const nicknameError = ref('')

onMounted(async () => {
  try {
    const res = await authApi.getMe()
    if (authStore.user) Object.assign(authStore.user, res.data.data)
    nickname.value = res.data.data.nickname
  } catch {}
})

const profileImage = ref<File | null>(null)
const profileImagePreviewUrl = ref('')
const imageUrlInput = ref('')
const imageLoading = ref(false)
const imageError = ref('')
const imageInputRef = ref<HTMLInputElement | null>(null)

function openImagePicker() {
  imageInputRef.value?.click()
}

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  profileImage.value = file
  imageUrlInput.value = ''
  if (profileImagePreviewUrl.value) URL.revokeObjectURL(profileImagePreviewUrl.value)
  profileImagePreviewUrl.value = URL.createObjectURL(file)
  imageError.value = ''
}

function cancelImageChange() {
  if (profileImagePreviewUrl.value) URL.revokeObjectURL(profileImagePreviewUrl.value)
  profileImage.value = null
  profileImagePreviewUrl.value = ''
  imageUrlInput.value = ''
  imageError.value = ''
  if (imageInputRef.value) imageInputRef.value.value = ''
}

async function updateProfileImage() {
  if (!profileImage.value && !imageUrlInput.value.trim()) return
  imageLoading.value = true
  imageError.value = ''
  try {
    const profileImageUrl = profileImage.value
      ? (await authApi.uploadProfileImage(profileImage.value)).data.data
      : imageUrlInput.value.trim()
    await authApi.updateProfile({ profileImageUrl })
    if (authStore.user) authStore.user.profileImageUrl = profileImageUrl
    cancelImageChange()
  } catch (e: any) {
    imageError.value = e.response?.data?.message ?? '이미지 변경에 실패했습니다.'
  } finally {
    imageLoading.value = false
  }
}

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
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base mt-14">
    <AppHeader />
    <main class="pt-14 max-w-lg mx-auto w-full px-4 py-8 space-y-6">

      <h1 class="text-xl font-bold text-ink dark:text-dark-text tracking-tight">프로필 설정</h1>

      <!-- 프로필 이미지 (상단 원형 아바타) -->
      <section class="flex flex-col items-center gap-3 py-2">
        <button
          type="button"
          class="group relative w-24 h-24 rounded-full overflow-hidden bg-canvas-soft dark:bg-dark-elevated border border-hairline dark:border-dark-border cursor-pointer transition-transform active:scale-95"
          @click="openImagePicker"
        >
          <img
            v-if="profileImagePreviewUrl || authStore.user?.profileImageUrl"
            :src="profileImagePreviewUrl || authStore.user?.profileImageUrl || ''"
            class="w-full h-full object-cover transition-opacity duration-300"
          />
          <span v-else class="w-full h-full flex items-center justify-center text-xs text-ink-faint dark:text-dark-muted">없음</span>

          <span
            class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/45 transition-colors duration-200"
          >
            <span class="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">변경</span>
          </span>

          <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
        </button>

        <div class="flex items-center gap-2 w-full max-w-xs">
          <input
            v-model="imageUrlInput"
            type="text"
            placeholder="또는 이미지 URL 직접 입력"
            class="flex-1 px-3 py-1.5 text-xs border border-hairline dark:border-dark-border rounded-full bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
            @input="profileImage = null"
          />
        </div>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div v-if="profileImage || imageUrlInput.trim()" class="flex items-center gap-2">
            <button
              type="button"
              :disabled="imageLoading"
              class="px-3 py-1 text-xs font-medium bg-accent hover:bg-accent-hover text-white rounded-full disabled:opacity-50 cursor-pointer transition-colors"
              @click="updateProfileImage"
            >{{ imageLoading ? '적용 중...' : '적용' }}</button>
            <button
              type="button"
              :disabled="imageLoading"
              class="px-3 py-1 text-xs font-medium border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted rounded-full cursor-pointer hover:border-accent transition-colors"
              @click="cancelImageChange"
            >취소</button>
          </div>
        </Transition>

        <p v-if="imageError" class="text-xs text-red-500 dark:text-red-400">{{ imageError }}</p>
      </section>

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

    </main>
  </div>
</template>
