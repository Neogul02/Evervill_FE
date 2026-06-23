<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api'

const router = useRouter()

const email = ref('')
const nickname = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const loading = ref(false)

const profileImage = ref<File | null>(null)
const profileImagePreviewUrl = ref('')

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  profileImage.value = file
  if (profileImagePreviewUrl.value) URL.revokeObjectURL(profileImagePreviewUrl.value)
  profileImagePreviewUrl.value = URL.createObjectURL(file)
}

function removeImage() {
  if (profileImagePreviewUrl.value) URL.revokeObjectURL(profileImagePreviewUrl.value)
  profileImage.value = null
  profileImagePreviewUrl.value = ''
}

async function onRegister() {
  if (!email.value || !password.value || !passwordConfirm.value) return
  if (password.value.length < 8) { error.value = '비밀번호는 8자 이상이어야 합니다'; return }
  if (password.value !== passwordConfirm.value) { error.value = '비밀번호가 일치하지 않습니다'; return }

  loading.value = true
  error.value = ''
  try {
    await authApi.register({
      email: email.value,
      password: password.value,
      nickname: nickname.value.trim() || undefined,
      profileImage: profileImage.value ?? undefined,
    })
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
            <input v-model="nickname" type="text" placeholder="미입력 시 이메일 앞부분으로 자동 설정"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">프로필 이미지 (선택)</label>
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-full overflow-hidden bg-canvas-soft dark:bg-dark-elevated border border-hairline dark:border-dark-border flex items-center justify-center shrink-0">
                <img v-if="profileImagePreviewUrl" :src="profileImagePreviewUrl" class="w-full h-full object-cover" />
                <span v-else class="text-xs text-ink-faint dark:text-dark-muted">없음</span>
              </div>
              <label class="px-3 py-1.5 text-xs font-medium border border-hairline dark:border-dark-border rounded-full cursor-pointer hover:border-accent transition-colors">
                이미지 선택
                <input type="file" accept="image/*" class="hidden" @change="handleImageSelect" />
              </label>
              <button v-if="profileImage" type="button" @click="removeImage" class="text-xs text-red-500 hover:underline cursor-pointer">제거</button>
            </div>
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

          <button type="submit" :disabled="loading"
            class="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded-full text-sm font-semibold disabled:opacity-50 transition-colors cursor-pointer active:scale-[0.98] shadow-sm mt-2">
            {{ loading ? '가입 중...' : '회원가입' }}
          </button>
        </form>

        <p class="mt-5 text-center text-sm text-ink-faint dark:text-dark-muted">
          이미 계정이 있으신가요?
          <RouterLink to="/login" class="text-accent hover:underline font-medium">로그인</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
