<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const code = computed(() => Number(route.query.code) || 500)
const retrying = ref(false)

const config = computed(() => {
  switch (code.value) {
    case 500: return {
      title: '서버 오류가 발생했어요',
      desc: '서버 내부에서 오류가 발생했습니다\n잠시 후 다시 시도해주세요',
    }
    case 502: return {
      title: '서버 연결에 실패했어요',
      desc: '게이트웨이 연결에 문제가 생겼습니다\n잠시 후 다시 시도해주세요',
    }
    case 503: return {
      title: '서비스 점검 중이에요',
      desc: '현재 서비스를 일시적으로 이용할 수 없습니다\n잠시 후 다시 시도해주세요',
    }
    case 504: return {
      title: '서버 응답 시간이 초과됐어요',
      desc: '서버가 응답하는 데 너무 오래 걸렸습니다\n네트워크 상태를 확인 후 다시 시도해주세요',
    }
    default: return {
      title: '서버에 문제가 발생했어요',
      desc: '일시적인 서버 오류입니다\n잠시 후 다시 시도해주세요',
    }
  }
})

async function retry() {
  retrying.value = true
  await new Promise(r => setTimeout(r, 800))
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen bg-canvas-soft dark:bg-dark-base flex flex-col items-center justify-center px-4 transition-colors duration-200">

    <!-- 배경 숫자 -->
    <div class="relative select-none">
      <span class="text-[180px] md:text-[240px] font-black text-hairline dark:text-dark-surface leading-none">
        {{ code }}
      </span>
      <div class="absolute inset-0 flex items-center justify-center">
        <!-- 서버 아이콘 -->
        <svg class="w-24 h-24 md:w-32 md:h-32 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v.75a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25v-.75m17.25 0a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 002.25 17.25m17.25 0V11.25m-17.25 6V11.25m0 0a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25m-17.25 0V9a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 9v2.25M12 6.75h.008v.008H12V6.75zm0 6h.008v.008H12v-.008zm0-3h.008v.008H12v-.008z" />
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
        class="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white font-medium rounded-full transition-all duration-150 cursor-pointer active:scale-95 shadow-sm"
        :disabled="retrying"
        @click="retry"
      >
        <svg
          class="w-3.5 h-3.5 transition-transform duration-500"
          :class="{ 'animate-spin': retrying }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ retrying ? '재시도 중...' : '다시 시도' }}
      </button>
      <button
        class="px-4 py-2 text-sm border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated font-medium rounded-full transition-all duration-150 cursor-pointer active:scale-95"
        @click="router.push('/')"
      >
        홈으로 돌아가기
      </button>
    </div>

    <!-- 에러 코드 표시 -->
    <p class="mt-8 text-xs text-ink-faint dark:text-dark-muted/50 font-mono">
      Error Code: {{ code }}
    </p>

  </div>
</template>
