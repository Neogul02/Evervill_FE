<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const code = computed(() => Number(route.query.code) || 400)

const config = computed(() => {
  switch (code.value) {
    case 400: return {
      icon: 'alert',
      title: '잘못된 요청이에요',
      desc: '요청 형식이 올바르지 않습니다\n입력 내용을 확인 후 다시 시도해주세요',
    }
    case 401: return {
      icon: 'lock',
      title: '로그인이 필요해요',
      desc: '이 페이지에 접근하려면 로그인이 필요합니다',
    }
    case 403: return {
      icon: 'ban',
      title: '접근 권한이 없어요',
      desc: '이 페이지에 접근할 수 있는 권한이 없습니다\n관리자에게 문의해주세요',
    }
    case 408: return {
      icon: 'clock',
      title: '요청 시간이 초과됐어요',
      desc: '요청 처리 시간이 너무 오래 걸렸습니다\n잠시 후 다시 시도해주세요',
    }
    case 429: return {
      icon: 'warning',
      title: '요청이 너무 많아요',
      desc: '잠시 후 다시 시도해주세요',
    }
    default: return {
      icon: 'alert',
      title: '요청을 처리할 수 없어요',
      desc: '일시적인 오류가 발생했습니다\n잠시 후 다시 시도해주세요',
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-canvas-soft dark:bg-dark-base flex flex-col items-center justify-center px-4 transition-colors duration-200">

    <!-- 배경 숫자 -->
    <div class="relative select-none">
      <span class="text-[180px] md:text-[240px] font-black text-hairline dark:text-dark-surface leading-none">
        {{ code }}
      </span>
      <div class="absolute inset-0 flex items-center justify-center">

        <!-- alert -->
        <svg v-if="config.icon === 'alert'" class="w-24 h-24 md:w-32 md:h-32 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>

        <!-- lock -->
        <svg v-else-if="config.icon === 'lock'" class="w-24 h-24 md:w-32 md:h-32 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>

        <!-- ban -->
        <svg v-else-if="config.icon === 'ban'" class="w-24 h-24 md:w-32 md:h-32 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>

        <!-- clock -->
        <svg v-else-if="config.icon === 'clock'" class="w-24 h-24 md:w-32 md:h-32 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <!-- warning (default) -->
        <svg v-else class="w-24 h-24 md:w-32 md:h-32 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>

      </div>
    </div>

    <div class="text-center mt-2 mb-10 space-y-3">
      <h1 class="text-2xl md:text-3xl font-bold text-ink dark:text-dark-text">
        {{ config.title }}
      </h1>
      <p class="text-sm text-ink-muted dark:text-dark-muted max-w-sm mx-auto leading-relaxed whitespace-pre-line">
        {{ config.desc }}
      </p>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <button
        v-if="code === 401"
        class="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white font-medium rounded-full transition-all duration-150 cursor-pointer active:scale-95 shadow-sm"
        @click="router.push('/login')"
      >
        로그인하기
      </button>
      <button
        v-else
        class="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white font-medium rounded-full transition-all duration-150 cursor-pointer active:scale-95 shadow-sm"
        @click="router.push('/')"
      >
        홈으로 돌아가기
      </button>
      <button
        class="px-4 py-2 text-sm border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated font-medium rounded-full transition-all duration-150 cursor-pointer active:scale-95"
        @click="router.back()"
      >
        이전 페이지
      </button>
    </div>

  </div>
</template>
