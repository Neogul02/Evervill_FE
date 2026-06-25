<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listingsApi } from '@/api'
import type { MyOfferedListing } from '@/types'
import { formatListingPrice, formatArea, formatFloor, formatManWon, STATUS_LABEL } from '@/utils/format'
import { STATUS_TONE } from '@/constants/dealTypeColors'
import AppHeader from '@/components/layout/AppHeader.vue'
import Badge from '@/components/ui/Badge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'

const listings = ref<MyOfferedListing[]>([])
const { loading, run } = useAsyncAction()
const error = ref(false)

async function fetchMyOfferedListings() {
  error.value = false
  await run(async () => {
    const res = await listingsApi.getMyOfferedListings()
    listings.value = res.data.data ?? []
  }).catch(() => {
    error.value = true
  })
}

onMounted(fetchMyOfferedListings)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base mt-10">
    <AppHeader />
    <main class="pt-14 max-w-3xl mx-auto w-full px-4 pb-8">
      <h1 class="text-xl font-bold text-ink dark:text-dark-text tracking-tight mb-6">내 제안 매물</h1>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3 text-ink-faint dark:text-dark-muted">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm">불러오는 중...</p>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm font-medium text-ink dark:text-dark-text">불러오기 실패</p>
        <BaseButton variant="secondary" size="sm" @click="fetchMyOfferedListings">다시 시도</BaseButton>
      </div>

      <div v-else-if="listings.length === 0" class="flex flex-col items-center justify-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm">아직 가격을 제안한 매물이 없습니다</p>
        <RouterLink to="/" class="text-sm text-accent hover:underline">매물 둘러보기</RouterLink>
      </div>

      <div v-else class="space-y-2">
        <RouterLink
          v-for="listing in listings"
          :key="listing.id"
          :to="`/listings/${listing.id}`"
          class="block bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4 flex gap-4 hover:shadow-sm hover:border-accent/30 transition-all"
        >
          <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-canvas-soft dark:bg-dark-elevated">
            <img
              v-if="listing.images?.length"
              :src="listing.images[0].imageUrl"
              :alt="listing.title"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-xl text-ink-faint dark:text-dark-muted">🏠</div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <h3 class="text-sm font-semibold text-ink dark:text-dark-text truncate">{{ listing.title }}</h3>
              <Badge v-if="STATUS_LABEL[listing.status]" class="shrink-0" :tone="STATUS_TONE[listing.status]">{{ STATUS_LABEL[listing.status] }}</Badge>
            </div>
            <p class="text-sm font-semibold text-accent mb-1">{{ formatListingPrice(listing) }}</p>
            <p class="text-xs font-medium text-ink-secondary dark:text-dark-text mb-1">제안한 복비: {{ formatManWon(listing.myOfferPrice) }}</p>
            <p class="text-xs text-ink-faint dark:text-dark-muted mb-1 truncate">{{ listing.address }}</p>
            <div class="flex gap-3 text-xs text-ink-faint dark:text-dark-muted">
              <span v-if="listing.area">{{ formatArea(listing.area) }}</span>
              <span v-if="listing.floor">{{ formatFloor(listing.floor) }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </main>
  </div>
</template>
