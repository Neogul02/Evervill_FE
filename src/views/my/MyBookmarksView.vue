<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Listing, MarketProperty } from '@/types'
import { listingsApi } from '@/api'
import { marketApi } from '@/api/market'
import { formatListingPrice, formatArea, formatFloor } from '@/utils/format'
import { DEAL_TYPE_TONE } from '@/constants/dealTypeColors'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Badge from '@/components/ui/Badge.vue'

type Tab = 'listing' | 'market'

const activeTab = ref<Tab>('listing')

const listingBookmarks = ref<Listing[]>([])
const marketBookmarks = ref<MarketProperty[]>([])
const loading = ref(false)
const error = ref(false)

async function fetchListingBookmarks() {
  loading.value = true
  error.value = false
  try {
    const res = await listingsApi.getBookmarks()
    listingBookmarks.value = res.data.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function fetchMarketBookmarks() {
  loading.value = true
  error.value = false
  try {
    const res = await marketApi.getBookmarks()
    marketBookmarks.value = res.data.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function switchTab(tab: Tab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  error.value = false
  if (tab === 'listing' && listingBookmarks.value.length === 0) {
    await fetchListingBookmarks()
  } else if (tab === 'market' && marketBookmarks.value.length === 0) {
    await fetchMarketBookmarks()
  }
}

async function removeListingBookmark(listing: Listing) {
  try {
    await listingsApi.unbookmark(listing.id)
    listingBookmarks.value = listingBookmarks.value.filter(b => b.id !== listing.id)
  } catch {}
}

async function removeMarketBookmark(property: MarketProperty) {
  try {
    await marketApi.unbookmark(property.id)
    marketBookmarks.value = marketBookmarks.value.filter(b => b.id !== property.id)
  } catch {}
}

function formatMarketPrice(amount: number) {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}억`
  return `${amount.toLocaleString()}만원`
}

function formatMarketDealType(dealType: string) {
  const map: Record<string, string> = { SALE: '매매', JEONSE: '전세', MONTHLY_RENT: '월세' }
  return map[dealType] ?? dealType
}

onMounted(fetchListingBookmarks)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base mt-10">
    <AppHeader />
    <main class="pt-14 max-w-3xl mx-auto w-full px-4 pb-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-ink dark:text-dark-text tracking-tight">북마크</h1>
        <span class="text-sm text-ink-faint dark:text-dark-muted">
          {{ activeTab === 'listing' ? listingBookmarks.length : marketBookmarks.length }}건
        </span>
      </div>

      <!-- 탭 -->
      <div class="flex gap-1 mb-6 border-b border-hairline dark:border-dark-border">
        <button
          v-for="[key, label] in [['listing','매물'],['market','실거래가']]"
          :key="key"
          @click="switchTab(key as Tab)"
          class="px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px"
          :class="activeTab === key
            ? 'border-accent text-accent'
            : 'border-transparent text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text'"
        >{{ label }}</button>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>

      <div v-else-if="error" class="flex flex-col items-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm">불러오기 실패</p>
        <BaseButton variant="secondary" size="sm"
          @click="activeTab === 'listing' ? fetchListingBookmarks() : fetchMarketBookmarks()">다시 시도</BaseButton>
      </div>

      <!-- 매물 탭 -->
      <template v-else-if="activeTab === 'listing'">
        <div v-if="listingBookmarks.length === 0" class="flex flex-col items-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
          <p class="text-sm">저장한 매물이 없습니다</p>
          <RouterLink to="/" class="text-sm text-accent hover:underline">매물 둘러보기</RouterLink>
        </div>
        <div v-else class="space-y-2">
          <div v-for="listing in listingBookmarks" :key="listing.id"
            class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4 flex gap-4 hover:shadow-sm transition-shadow">
            <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-canvas-soft dark:bg-dark-elevated">
              <img v-if="listing.images?.[0]?.imageUrl" :src="listing.images[0].imageUrl" :alt="listing.title" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-[11px] text-ink-faint dark:text-dark-muted">사진없음</div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-1">
                <RouterLink :to="`/listings/${listing.id}`"
                  class="text-sm font-semibold text-ink dark:text-dark-text truncate hover:text-accent transition-colors">
                  {{ listing.title }}
                </RouterLink>
                <button class="shrink-0 text-xs text-ink-faint dark:text-dark-muted hover:text-red-500 transition-colors cursor-pointer"
                  @click="removeListingBookmark(listing)">삭제</button>
              </div>
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
      </template>

      <!-- 실거래가 탭 -->
      <template v-else>
        <div v-if="marketBookmarks.length === 0" class="flex flex-col items-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
          <p class="text-sm">저장한 실거래가가 없습니다</p>
          <RouterLink to="/market" class="text-sm text-accent hover:underline">실거래가 둘러보기</RouterLink>
        </div>
        <div v-else class="space-y-2">
          <div v-for="property in marketBookmarks" :key="property.id"
            class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4 flex gap-4 hover:shadow-sm transition-shadow">
            <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-canvas-soft dark:bg-dark-elevated flex items-center justify-center text-[11px] text-ink-faint dark:text-dark-muted">사진없음</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-ink dark:text-dark-text truncate">{{ property.propertyName }}</p>
                  <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">{{ property.districtName }}</p>
                </div>
                <button class="shrink-0 text-xs text-ink-faint dark:text-dark-muted hover:text-red-500 transition-colors cursor-pointer"
                  @click="removeMarketBookmark(property)">삭제</button>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <Badge :tone="DEAL_TYPE_TONE[property.dealType]">{{ formatMarketDealType(property.dealType) }}</Badge>
                <span class="text-sm font-semibold text-accent">{{ formatMarketPrice(property.dealAmount) }}</span>
                <span v-if="property.area" class="text-xs text-ink-faint dark:text-dark-muted">{{ formatArea(property.area) }}</span>
                <span class="text-xs text-ink-faint dark:text-dark-muted ml-auto">
                  {{ property.dealYear }}.{{ String(property.dealMonth).padStart(2, '0') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
