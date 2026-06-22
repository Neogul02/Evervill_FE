<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import logoImg from '@/assets/evervill_logo.png'
// TODO: 다크모드용 화이트 로고 에셋(evervill_logo_white.png)이 아직 없어 기본 로고로 대체
const logoWhiteImg = logoImg

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const searchQuery = ref((route.query.address as string) ?? '')
const { isDark, toggle } = useTheme()

function logout() {
  authStore.logout()
  router.push('/login')
}

function onSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/', query: { address: q } })
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 h-14 bg-canvas dark:bg-dark-surface border-b border-hairline dark:border-dark-border flex items-center px-5 transition-colors duration-200">

    <!-- ── 왼쪽: 로고 + 도메인 링크 ── -->
    <div class="flex items-center gap-0.5 shrink-0">
      <RouterLink to="/" class="flex items-center mr-3 cursor-pointer">
        <img :src="isDark ? logoWhiteImg : logoImg" alt="Evervill" class="h-10 w-auto object-contain" />
      </RouterLink>

      <RouterLink
        to="/"
        class="text-xs text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
      >매물</RouterLink>

      <RouterLink
        to="/market"
        class="text-xs text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
      >실거래가</RouterLink>

      <RouterLink
        to="/notices"
        class="text-xs text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
      >공지사항</RouterLink>
    </div>

    <!-- ── 검색 ── -->
    <div class="flex-1 flex justify-center px-4">
      <div class="w-full max-w-xs">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="지역, 주소 검색"
          class="w-full px-2.5 py-1 text-xs border border-hairline dark:border-dark-border rounded bg-canvas-soft dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
          @keydown.enter="onSearch"
        />
      </div>
    </div>

    <!-- ── 오른쪽: 유저 링크 + 다크모드 ── -->
    <nav class="flex items-center gap-0.5 shrink-0">

      <template v-if="authStore.isAuthenticated">
        <RouterLink
          to="/my/listings"
          class="hidden sm:block text-xs text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
        >내매물</RouterLink>

        <RouterLink
          to="/my/bookmarks"
          class="hidden sm:block text-xs text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
        >북마크</RouterLink>

        <RouterLink
          to="/chat"
          class="text-xs text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
        >채팅</RouterLink>

        <RouterLink
          v-if="authStore.user?.role === 'ADMIN'"
          to="/admin"
          class="hidden sm:block text-xs text-accent hover:text-accent-hover px-2.5 py-1 rounded hover:bg-accent-light dark:hover:bg-accent-dark-muted transition-colors"
        >관리자</RouterLink>

        <div class="w-px h-3.5 bg-hairline dark:bg-dark-border mx-1" />

        <RouterLink
          to="/my/profile"
          class="hidden sm:block text-xs text-ink-faint dark:text-dark-muted px-1.5 hover:text-ink dark:hover:text-dark-text transition-colors max-w-[80px] truncate"
        >{{ authStore.user?.nickname ?? authStore.user?.email }}</RouterLink>

        <button
          class="text-xs text-ink-faint dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
          @click="logout"
        >로그아웃</button>
      </template>

      <RouterLink
        v-else
        to="/login"
        class="text-xs font-semibold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer active:scale-95 shadow-sm ml-1"
      >로그인</RouterLink>

      <!-- 다크모드 토글 -->
      <button
        class="ml-0.5 p-1.5 rounded text-ink-faint dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated hover:text-ink dark:hover:text-dark-text transition-colors cursor-pointer"
        :aria-label="isDark ? '라이트 모드' : '다크 모드'"
        @click="toggle"
      >
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </nav>
  </header>
</template>
