<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores'
import { authApi } from '@/api'
import { NICKNAME_PATTERN, isReservedNickname, containsUnsafePattern } from '@/utils/validation'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ChevronRight, Camera, User, Mail, Lock, Check } from 'lucide-vue-next'

const authStore = useAuthStore()

// ── 현재 열린 편집 필드 ──────────────────────────────────────────
type Field = 'photo' | 'nickname' | 'password' | null
const activeField = ref<Field>(null)

function toggleField(field: Field) {
  activeField.value = activeField.value === field ? null : field
  // 필드 전환 시 각 에러/성공 초기화
  nicknameError.value = ''
  nicknameSuccess.value = false
  passwordError.value = ''
  passwordSuccess.value = false
  imageError.value = ''
}

// ── 사용자 정보 로드 ─────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await authApi.getMe()
    if (authStore.user) Object.assign(authStore.user, res.data.data)
    nickname.value = res.data.data.nickname
  } catch {}
})

// ── 프로필 이미지 ────────────────────────────────────────────────
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
  activeField.value = null
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

// ── 닉네임 ──────────────────────────────────────────────────────
const nickname = ref(authStore.user?.nickname ?? '')
const nicknameLoading = ref(false)
const nicknameSuccess = ref(false)
const nicknameError = ref('')

async function updateNickname() {
  const trimmed = nickname.value.trim()
  if (!trimmed) return
  if (!NICKNAME_PATTERN.test(trimmed)) {
    nicknameError.value = '한글/영문/숫자/언더스코어 2~20자로 입력해주세요'
    return
  }
  if (isReservedNickname(trimmed) || containsUnsafePattern(trimmed)) {
    nicknameError.value = '사용할 수 없는 닉네임입니다'
    return
  }
  nicknameLoading.value = true
  nicknameSuccess.value = false
  nicknameError.value = ''
  try {
    await authApi.updateProfile({ nickname: trimmed })
    if (authStore.user) authStore.user.nickname = trimmed
    nicknameSuccess.value = true
    setTimeout(() => { activeField.value = null }, 800)
  } catch (e: any) {
    nicknameError.value = e.response?.data?.message ?? '닉네임 변경에 실패했습니다.'
  } finally {
    nicknameLoading.value = false
  }
}

// ── 비밀번호 ─────────────────────────────────────────────────────
const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

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
    setTimeout(() => { activeField.value = null }, 800)
  } catch (e: any) {
    passwordError.value = e.response?.data?.message ?? '비밀번호 변경에 실패했습니다.'
  } finally {
    passwordLoading.value = false
  }
}

function cancelPassword() {
  currentPassword.value = ''
  newPassword.value = ''
  newPasswordConfirm.value = ''
  passwordError.value = ''
  passwordSuccess.value = false
  activeField.value = null
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />
    <main class="pt-14 max-w-lg mx-auto w-full px-4 pb-12">

      <!-- ── 프로필 헤더 카드 ── -->
      <section class="flex flex-col items-center gap-3 py-8">
        <!-- 아바타 -->
        <div class="relative">
          <button
            type="button"
            class="group relative w-24 h-24 rounded-full overflow-hidden bg-canvas-soft dark:bg-dark-elevated border-2 border-hairline dark:border-dark-border shadow-md cursor-pointer transition-transform active:scale-95"
            @click="openImagePicker"
          >
            <img
              v-if="profileImagePreviewUrl || authStore.user?.profileImageUrl"
              :src="profileImagePreviewUrl || authStore.user?.profileImageUrl || ''"
              class="w-full h-full object-cover"
            />
            <span v-else class="w-full h-full flex items-center justify-center text-2xl text-ink-faint dark:text-dark-muted select-none">
              {{ authStore.user?.nickname?.[0]?.toUpperCase() ?? '?' }}
            </span>
            <!-- 호버 오버레이 -->
            <span class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/45 transition-colors duration-200">
              <Camera class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </span>
            <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
          </button>
          <!-- 카메라 뱃지 -->
          <span class="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-accent border-2 border-canvas dark:border-dark-base flex items-center justify-center pointer-events-none">
            <Camera class="w-3 h-3 text-white" />
          </span>
        </div>

        <!-- 이름 + 이메일 -->
        <div class="text-center">
          <p class="text-lg font-bold text-ink dark:text-dark-text tracking-tight">
            {{ authStore.user?.nickname ?? '–' }}
          </p>
          <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">
            {{ authStore.user?.email ?? '–' }}
          </p>
        </div>
      </section>

      <!-- ── 항목 리스트 카드 ── -->
      <div class="bg-canvas dark:bg-dark-surface rounded-2xl border border-hairline dark:border-dark-border overflow-hidden shadow-sm">

        <!-- ① 프로필 사진 -->
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-5 py-4 hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            :class="activeField === 'photo' ? 'bg-accent-light dark:bg-accent-dark-muted' : ''"
            @click="toggleField('photo')"
          >
            <span class="w-8 h-8 rounded-full bg-accent-light dark:bg-accent-dark-muted flex items-center justify-center shrink-0">
              <Camera class="w-4 h-4 text-accent" />
            </span>
            <span class="flex-1 text-left">
              <span class="block text-xs text-ink-faint dark:text-dark-muted">프로필 사진</span>
              <span class="block text-sm font-medium text-ink dark:text-dark-text mt-0.5">
                {{ authStore.user?.profileImageUrl ? '사진 변경' : '사진 설정' }}
              </span>
            </span>
            <ChevronRight
              class="w-4 h-4 text-ink-faint dark:text-dark-muted transition-transform duration-200"
              :class="activeField === 'photo' ? 'rotate-90 text-accent' : ''"
            />
          </button>

          <!-- 프로필 사진 편집 영역 -->
          <Transition
            enter-active-class="transition-all duration-250 ease-out overflow-hidden"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-96 opacity-100"
            leave-active-class="transition-all duration-200 ease-in overflow-hidden"
            leave-from-class="max-h-96 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="activeField === 'photo'" class="px-5 pb-5 pt-1 bg-accent-light/40 dark:bg-accent-dark-muted/40 space-y-3">
              <input
                v-model="imageUrlInput"
                type="text"
                placeholder="이미지 URL 직접 입력"
                class="w-full px-3 py-2 text-sm border border-hairline dark:border-dark-border rounded-lg bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
                @input="profileImage = null"
              />
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-hairline dark:border-dark-border rounded-lg bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted hover:border-accent transition-colors cursor-pointer"
                  @click="openImagePicker"
                >
                  <Camera class="w-3.5 h-3.5" /> 파일 선택
                </button>
                <button
                  v-if="profileImage || imageUrlInput.trim()"
                  type="button"
                  :disabled="imageLoading"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-accent hover:bg-accent-hover text-white rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
                  @click="updateProfileImage"
                >
                  <Check class="w-3.5 h-3.5" />{{ imageLoading ? '저장 중...' : '저장' }}
                </button>
                <button
                  type="button"
                  :disabled="imageLoading"
                  class="px-3 py-2 text-xs font-medium text-ink-faint dark:text-dark-muted hover:text-ink dark:hover:text-dark-text transition-colors cursor-pointer"
                  @click="cancelImageChange"
                >
                  취소
                </button>
              </div>
              <p v-if="imageError" class="text-xs text-red-500 dark:text-red-400">{{ imageError }}</p>
            </div>
          </Transition>
          <div class="h-px bg-hairline dark:bg-dark-border" />
        </div>

        <!-- ② 닉네임 -->
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-5 py-4 hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            :class="activeField === 'nickname' ? 'bg-accent-light dark:bg-accent-dark-muted' : ''"
            @click="toggleField('nickname')"
          >
            <span class="w-8 h-8 rounded-full bg-accent-light dark:bg-accent-dark-muted flex items-center justify-center shrink-0">
              <User class="w-4 h-4 text-accent" />
            </span>
            <span class="flex-1 text-left">
              <span class="block text-xs text-ink-faint dark:text-dark-muted">닉네임</span>
              <span class="block text-sm font-medium text-ink dark:text-dark-text mt-0.5">
                {{ authStore.user?.nickname ?? '–' }}
              </span>
            </span>
            <ChevronRight
              class="w-4 h-4 text-ink-faint dark:text-dark-muted transition-transform duration-200"
              :class="activeField === 'nickname' ? 'rotate-90 text-accent' : ''"
            />
          </button>

          <!-- 닉네임 편집 영역 -->
          <Transition
            enter-active-class="transition-all duration-250 ease-out overflow-hidden"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-64 opacity-100"
            leave-active-class="transition-all duration-200 ease-in overflow-hidden"
            leave-from-class="max-h-64 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="activeField === 'nickname'" class="px-5 pb-5 pt-1 bg-accent-light/40 dark:bg-accent-dark-muted/40 space-y-3">
              <input
                v-model="nickname"
                type="text"
                maxlength="20"
                placeholder="새 닉네임 입력"
                class="w-full px-3 py-2 text-sm border border-hairline dark:border-dark-border rounded-lg bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
                @keydown.enter="updateNickname"
              />
              <p v-if="nicknameError" class="text-xs text-red-500 dark:text-red-400">{{ nicknameError }}</p>
              <p v-if="nicknameSuccess" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check class="w-3.5 h-3.5" /> 닉네임이 변경됐습니다.
              </p>
              <div class="flex gap-2">
                <BaseButton
                  variant="primary"
                  size="sm"
                  :disabled="nicknameLoading || !nickname.trim()"
                  @click="updateNickname"
                >
                  {{ nicknameLoading ? '변경 중...' : '저장' }}
                </BaseButton>
                <BaseButton variant="utility" size="sm" @click="activeField = null">
                  취소
                </BaseButton>
              </div>
            </div>
          </Transition>
          <div class="h-px bg-hairline dark:bg-dark-border" />
        </div>

        <!-- ③ 이메일 (읽기 전용) -->
        <div class="flex items-center gap-3 px-5 py-4">
          <span class="w-8 h-8 rounded-full bg-canvas-soft dark:bg-dark-elevated flex items-center justify-center shrink-0">
            <Mail class="w-4 h-4 text-ink-faint dark:text-dark-muted" />
          </span>
          <span class="flex-1">
            <span class="block text-xs text-ink-faint dark:text-dark-muted">이메일</span>
            <span class="block text-sm font-medium text-ink dark:text-dark-text mt-0.5">
              {{ authStore.user?.email ?? '–' }}
            </span>
          </span>
          <span class="text-xs text-ink-faint dark:text-dark-muted px-2 py-0.5 rounded-full bg-canvas-soft dark:bg-dark-elevated">읽기 전용</span>
        </div>
        <div class="h-px bg-hairline dark:bg-dark-border" />

        <!-- ⑤ 비밀번호 -->
        <div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-5 py-4 hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            :class="activeField === 'password' ? 'bg-accent-light dark:bg-accent-dark-muted' : ''"
            @click="toggleField('password')"
          >
            <span class="w-8 h-8 rounded-full bg-accent-light dark:bg-accent-dark-muted flex items-center justify-center shrink-0">
              <Lock class="w-4 h-4 text-accent" />
            </span>
            <span class="flex-1 text-left">
              <span class="block text-xs text-ink-faint dark:text-dark-muted">비밀번호</span>
              <span class="block text-sm font-medium text-ink dark:text-dark-text mt-0.5">
                ••••••••
              </span>
            </span>
            <ChevronRight
              class="w-4 h-4 text-ink-faint dark:text-dark-muted transition-transform duration-200"
              :class="activeField === 'password' ? 'rotate-90 text-accent' : ''"
            />
          </button>

          <!-- 비밀번호 편집 영역 -->
          <Transition
            enter-active-class="transition-all duration-250 ease-out overflow-hidden"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[26rem] opacity-100"
            leave-active-class="transition-all duration-200 ease-in overflow-hidden"
            leave-from-class="max-h-[26rem] opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div v-if="activeField === 'password'" class="px-5 pb-5 pt-1 bg-accent-light/40 dark:bg-accent-dark-muted/40 space-y-3">
              <input
                v-model="currentPassword"
                type="password"
                placeholder="현재 비밀번호"
                class="w-full px-3 py-2 text-sm border border-hairline dark:border-dark-border rounded-lg bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
              />
              <input
                v-model="newPassword"
                type="password"
                placeholder="새 비밀번호 (8자 이상)"
                class="w-full px-3 py-2 text-sm border border-hairline dark:border-dark-border rounded-lg bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
              />
              <input
                v-model="newPasswordConfirm"
                type="password"
                placeholder="새 비밀번호 확인"
                class="w-full px-3 py-2 text-sm border border-hairline dark:border-dark-border rounded-lg bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
                @keydown.enter="updatePassword"
              />
              <p v-if="passwordError" class="text-xs text-red-500 dark:text-red-400">{{ passwordError }}</p>
              <p v-if="passwordSuccess" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check class="w-3.5 h-3.5" /> 비밀번호가 변경됐습니다.
              </p>
              <div class="flex gap-2">
                <BaseButton
                  variant="primary"
                  size="sm"
                  :disabled="passwordLoading || !currentPassword || !newPassword || !newPasswordConfirm"
                  @click="updatePassword"
                >
                  {{ passwordLoading ? '변경 중...' : '저장' }}
                </BaseButton>
                <BaseButton variant="utility" size="sm" @click="cancelPassword">
                  취소
                </BaseButton>
              </div>
            </div>
          </Transition>
        </div>

      </div>
    </main>
  </div>
</template>
