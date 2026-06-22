<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-canvas-soft dark:bg-dark-base flex flex-col items-center justify-center px-4">

    <div class="relative select-none">
      <span class="text-[180px] md:text-[240px] font-black text-hairline dark:text-dark-surface leading-none">
        404
      </span>
      <div class="absolute inset-0 flex items-center justify-center">
        <svg class="w-24 h-24 md:w-32 md:h-32 text-accent opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          <text x="11.5" y="18" text-anchor="middle" class="fill-accent" font-size="7" stroke="none" font-weight="bold">?</text>
        </svg>
      </div>
    </div>

    <div class="text-center mt-2 mb-10 space-y-3">
      <h1 class="text-2xl md:text-3xl font-bold text-ink dark:text-dark-text tracking-tight">
        페이지를 찾을 수 없어요
      </h1>
      <p class="text-sm text-ink-muted dark:text-dark-muted max-w-sm mx-auto leading-relaxed">
        요청하신 페이지가 존재하지 않거나<br />다른 곳으로 이동되었습니다
      </p>
    </div>

    <div class="flex flex-col sm:flex-row gap-3">
      <BaseButton @click="router.push('/')">홈으로 돌아가기</BaseButton>
      <BaseButton variant="secondary" @click="router.back()">이전 페이지</BaseButton>
    </div>

  </div>
</template>
