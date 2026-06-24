<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useTheme } from '@/composables/useTheme'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useUnreadChatCount } from '@/composables/useUnreadChatCount'
import { useChat } from '@/composables/useChat'
import { useConfirmModal } from '@/composables/useConfirmModal'
import IconButton from '@/components/ui/IconButton.vue'
import { Sun, Moon, Menu, X } from 'lucide-vue-next'
import logoImg from '@/assets/evervill_logo.png'
import logoWhiteImg from '@/assets/evervill_logo_white.png'

const authStore = useAuthStore()
const router = useRouter()
const { isDark, toggle } = useTheme()
const { isDesktop } = useBreakpoint()
const mobileMenuOpen = ref(false)
const { unreadCount, startPolling, stopPolling } = useUnreadChatCount()
const { connect, disconnect } = useChat()
const { open: openModal } = useConfirmModal()

watch(
  () => authStore.isAuthenticated,
  (authenticated) => {
    if (authenticated && authStore.token && authStore.user) {
      startPolling()
      connect(authStore.token, authStore.user.id)
    } else {
      stopPolling()
      disconnect()
    }
  },
  { immediate: true },
)

async function logout() {
  mobileMenuOpen.value = false
  const ok = await openModal({
    title: '로그아웃',
    message: '로그아웃하시겠습니까?',
    confirmText: '로그아웃',
    cancelText: '취소',
    danger: true,
  })
  if (ok) {
    authStore.logout()
    router.push('/')
  }
}

</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 h-14 bg-canvas dark:bg-dark-surface border-b border-hairline dark:border-dark-border transition-colors duration-150"
  >
    <div
      class="h-full flex items-center px-0 sm:px-16 md:px-20 md:mx-auto md:max-w-[1300px] select-none"
    >
      <!-- ── 왼쪽: 로고 + 도메인 링크 ── -->
      <div class="flex items-center gap-0.5 shrink-0">
        <RouterLink to="/" class="flex items-center mr-3 cursor-pointer">
          <img
            :src="isDark ? logoWhiteImg : logoImg"
            alt="Evervill"
            class="ml-2 h-8 md:h-10 w-auto object-contain"
            draggable="false"
          />
        </RouterLink>

        <RouterLink
          to="/"
          class="nav-link font-semibold"
          >매물</RouterLink
        >

        <RouterLink
          to="/market"
          class="nav-link font-semibold"
          >실거래가</RouterLink
        >

        <RouterLink
          to="/notices"
          class="nav-link font-semibold"
          >공지사항</RouterLink
        >
      </div>

      <!-- ── 검색 ── -->
      <div class="flex-1 flex justify-center px-2 sm:px-4 select-text">
        
      </div>

      <!-- ── 오른쪽: 유저 링크 + 다크모드 ── -->
      <nav class="flex items-center gap-0.5 shrink-0 relative">
        <!-- 데스크톱 전용 nav 링크 -->
        <template v-if="isDesktop">
          <template v-if="authStore.isAuthenticated">
            <RouterLink
              to="/my/listings"
              class="nav-link"
              >내매물</RouterLink
            >

            <RouterLink
              to="/my/bookmarks"
              class="nav-link"
              >북마크</RouterLink
            >

            <RouterLink
              to="/my/recent"
              class="nav-link"
              >최근 본 매물</RouterLink
            >

            <RouterLink
              to="/chat"
              class="nav-link relative"
              >채팅<span
                v-if="unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center font-medium leading-none"
              >{{ unreadCount > 9 ? '9+' : unreadCount }}</span></RouterLink
            >

            <RouterLink
              v-if="authStore.user?.role === 'ADMIN'"
              to="/admin"
              class="nav-link nav-link--admin"
              >관리자</RouterLink
            >

            <div class="w-px h-3.5 bg-hairline dark:bg-dark-border mx-1" />

            <RouterLink
              to="/my/profile"
              class="nav-link max-w-[80px] truncate"
              >내정보</RouterLink
            >

            <button
              class="text-xs text-ink-faint dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-2.5 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
              @click="logout"
            >
              로그아웃
            </button>
          </template>

          <RouterLink
            v-else
            to="/login"
            class="text-xs font-semibold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer active:scale-95 shadow-sm ml-1"
            >로그인</RouterLink
          >
        </template>

        <!-- 모바일: 로그인 상태가 아니면 로그인 버튼은 상시 노출 -->
        <RouterLink
          v-else-if="!authStore.isAuthenticated"
          to="/login"
          class="text-xs font-semibold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-full transition-colors cursor-pointer active:scale-95 shadow-sm ml-1"
          >로그인</RouterLink
        >

        <!-- 다크모드 토글 -->
        <IconButton
          class="ml-0.5"
          :aria-label="isDark ? '라이트 모드' : '다크 모드'"
          @click="toggle"
        >
          <Sun v-if="isDark" class="w-5 h-5" />
          <Moon v-else class="w-5 h-5" />
        </IconButton>

        <!-- 모바일 햄버거 메뉴 (인증 상태일 때만 접을 메뉴가 존재) -->
        <IconButton
          v-if="!isDesktop && authStore.isAuthenticated"
          :aria-label="mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <X v-if="mobileMenuOpen" class="w-4 h-4" />
          <Menu v-else class="w-4 h-4" />
        </IconButton>

        <!-- 모바일 드롭다운 -->
        <div
          v-if="!isDesktop && mobileMenuOpen && authStore.isAuthenticated"
          class="absolute top-full right-0 mt-2 w-44 bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border rounded-lg shadow-md py-1.5 flex flex-col"
        >
          <RouterLink
            to="/my/listings"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
            >내매물</RouterLink
          >

          <RouterLink
            to="/my/bookmarks"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
            >북마크</RouterLink
          >

          <RouterLink
            to="/my/recent"
            class="mobile-nav-link"
            @click="mobileMenuOpen = false"
            >최근 본 매물</RouterLink
          >

          <RouterLink
            to="/chat"
            class="mobile-nav-link flex items-center gap-1.5"
            @click="mobileMenuOpen = false"
            >채팅<span
              v-if="unreadCount > 0"
              class="bg-accent text-white text-[10px] rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center font-medium leading-none"
            >{{ unreadCount > 9 ? '9+' : unreadCount }}</span></RouterLink
          >

          <RouterLink
            v-if="authStore.user?.role === 'ADMIN'"
            to="/admin"
            class="mobile-nav-link mobile-nav-link--admin"
            @click="mobileMenuOpen = false"
            >관리자</RouterLink
          >

          <div class="h-px bg-hairline dark:bg-dark-border my-1" />

          <RouterLink
            to="/my/profile"
            class="mobile-nav-link truncate"
            @click="mobileMenuOpen = false"
            >내정보</RouterLink
          >

          <button
            class="text-xs text-left text-ink-faint dark:text-dark-muted hover:text-ink dark:hover:text-dark-text px-3 py-2 hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            @click="logout; mobileMenuOpen = false"
            
          >
            로그아웃
          </button>
        </div>
      </nav>
    </div>
  </header>
</template>

