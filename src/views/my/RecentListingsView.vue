<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Listing } from '@/types'
import { listingsApi } from '@/api'
import { formatListingPrice, formatArea, formatFloor } from '@/utils/format'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'

const recentListings = ref<Listing[]>([])
const { loading, run } = useAsyncAction()
const error = ref(false)

async function fetchRecentListings() {
  error.value = false
  await run(async () => {
    const res = await listingsApi.getRecent()
    recentListings.value = res.data.data
  }).catch(() => {
    error.value = true
  })
}

onMounted(fetchRecentListings)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base mt-10 md:mt-14">
    <AppHeader />
    <main class="pt-14 max-w-3xl mx-auto w-full px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-ink dark:text-dark-text tracking-tight">최근 본 매물</h1>
        <span class="text-sm text-ink-faint dark:text-dark-muted">{{ recentListings.length }}건</span>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>

      <div v-else-if="error" class="flex flex-col items-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm">불러오기 실패</p>
        <BaseButton variant="secondary" size="sm" @click="fetchRecentListings">다시 시도</BaseButton>
      </div>

      <div v-else-if="recentListings.length === 0" class="flex flex-col items-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm">최근 본 매물이 없습니다</p>
        <RouterLink to="/" class="text-sm text-accent hover:underline">매물 둘러보기</RouterLink>
      </div>

      <div v-else class="space-y-2">
        <div v-for="listing in recentListings" :key="listing.id"
          class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4 flex gap-4 hover:shadow-sm transition-shadow">
          <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-canvas-soft dark:bg-dark-elevated">
            <img v-if="listing.images?.[0]?.imageUrl" :src="listing.images[0].imageUrl" :alt="listing.title" loading="lazy" decoding="async" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-[11px] text-ink-faint dark:text-dark-muted">사진없음</div>
          </div>
          <div class="flex-1 min-w-0">
            <RouterLink :to="`/listings/${listing.id}`"
              class="text-sm font-semibold text-ink dark:text-dark-text truncate hover:text-accent transition-colors">
              {{ listing.title }}
            </RouterLink>
            <p class="text-sm font-semibold text-accent mb-1">{{ formatListingPrice(listing) }}</p>
            <p class="text-xs text-ink-faint dark:text-dark-muted">
              {{ listing.address }}<span v-if="listing.addressDetail"> · {{ listing.addressDetail }}</span>
            </p>
            <div class="flex gap-3 text-xs text-ink-faint dark:text-dark-muted mt-1">
              <span v-if="listing.area">{{ formatArea(listing.area) }}</span>
              <span v-if="listing.floor">{{ formatFloor(listing.floor) }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
