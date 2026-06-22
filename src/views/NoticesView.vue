<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { noticesApi } from '@/api/notices'
import type { NoticeResponse } from '@/types/notice'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const notices = ref<NoticeResponse[]>([])
const loading = ref(true)
const error = ref(false)
const openIds = ref<Set<number>>(new Set())

function toggle(id: number) {
  if (openIds.value.has(id)) openIds.value.delete(id)
  else openIds.value.add(id)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function fetchNotices() {
  loading.value = true
  error.value = false
  try {
    const res = await noticesApi.getList()
    notices.value = res.data.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchNotices)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />
    <main class="pt-14 max-w-3xl mx-auto w-full px-4 py-8">
      <h1 class="text-xl font-bold text-ink dark:text-dark-text mb-6 tracking-tight">공지사항</h1>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3 text-ink-faint dark:text-dark-muted">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm">불러오는 중...</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm font-medium text-ink dark:text-dark-text">불러오기 실패</p>
        <BaseButton variant="secondary" size="sm" @click="fetchNotices">다시 시도</BaseButton>
      </div>

      <div v-else-if="notices.length === 0" class="flex flex-col items-center justify-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm">공지사항이 없습니다</p>
      </div>

      <div v-else class="divide-y divide-hairline dark:divide-dark-border border border-hairline dark:border-dark-border rounded-xl overflow-hidden bg-canvas dark:bg-dark-surface">
        <div v-for="notice in notices" :key="notice.id">
          <button
            class="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
            @click="toggle(notice.id)"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-ink dark:text-dark-text truncate pr-4">{{ notice.title }}</p>
              <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">{{ formatDate(notice.createdAt) }}</p>
            </div>
            <svg
              class="w-4 h-4 text-ink-faint dark:text-dark-muted shrink-0 transition-transform duration-150"
              :class="openIds.has(notice.id) ? 'rotate-180' : ''"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-if="openIds.has(notice.id)" class="px-5 pb-5 border-t border-hairline dark:border-dark-border bg-canvas-soft dark:bg-dark-elevated">
            <p class="text-sm text-ink-secondary dark:text-dark-text leading-relaxed whitespace-pre-wrap pt-4">{{ notice.content }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
