<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MarketFilter, MarketDealType, MarketPropertyType } from '@/types'

const emit = defineEmits<{
  update: [filter: MarketFilter]
}>()

const dealType = ref<MarketDealType | undefined>(undefined)
const propertyType = ref<MarketPropertyType | undefined>(undefined)
const keyword = ref('')

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: '전체', min: undefined, max: undefined },
  { label: '1억 이하', min: undefined, max: 10000 },
  { label: '1~3억', min: 10000, max: 30000 },
  { label: '3~5억', min: 30000, max: 50000 },
  { label: '5~10억', min: 50000, max: 100000 },
  { label: '10억 이상', min: 100000, max: undefined },
]

const priceRange = ref(PRICE_RANGES[0])
let keywordTimer: ReturnType<typeof setTimeout> | undefined

const DEAL_TYPES: { value: MarketDealType | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'SALE', label: '매매' },
  { value: 'JEONSE', label: '전세' },
  { value: 'MONTHLY_RENT', label: '월세' },
]

const PROPERTY_TYPES: { value: MarketPropertyType | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'MULTI_FAMILY', label: '연립다세대' },
  { value: 'OFFICETEL', label: '오피스텔' },
]

function emitUpdate() {
  emit('update', {
    dealType: dealType.value,
    propertyType: propertyType.value,
    minPrice: priceRange.value.min,
    maxPrice: priceRange.value.max,
    keyword: keyword.value.trim() || undefined,
  })
}

watch([dealType, propertyType, priceRange], emitUpdate)
watch(keyword, () => {
  clearTimeout(keywordTimer)
  keywordTimer = setTimeout(emitUpdate, 400)
})
</script>

<template>
  <div class="px-4 py-3 border-b border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface space-y-3">
    <!-- 거래 유형 -->
    <div class="flex gap-1.5 flex-wrap">
      <button
        v-for="item in DEAL_TYPES"
        :key="item.label"
        class="px-3 py-1 text-xs rounded-full border font-medium transition-colors cursor-pointer"
        :class="dealType === item.value
          ? 'bg-accent text-white border-accent'
          : 'bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted border-hairline dark:border-dark-border hover:border-accent hover:text-accent'"
        @click="dealType = item.value"
      >{{ item.label }}</button>
    </div>
    <!-- 건물 유형 -->
    <div class="flex gap-1.5 flex-wrap">
      <button
        v-for="item in PROPERTY_TYPES"
        :key="item.label"
        class="px-3 py-1 text-xs rounded-full border font-medium transition-colors cursor-pointer"
        :class="propertyType === item.value
          ? 'bg-ink text-canvas border-ink dark:bg-dark-text dark:text-dark-base dark:border-dark-text'
          : 'bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted border-hairline dark:border-dark-border hover:border-ink-muted hover:text-ink'"
        @click="propertyType = item.value"
      >{{ item.label }}</button>
    </div>
    <!-- 가격 범위 -->
    <div class="flex gap-1.5 flex-wrap">
      <button
        v-for="range in PRICE_RANGES"
        :key="range.label"
        class="px-3 py-1 text-xs rounded-full border font-medium transition-colors cursor-pointer active:scale-95"
        :class="priceRange.label === range.label
          ? 'bg-accent text-white border-accent'
          : 'bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted border-hairline dark:border-dark-border hover:border-accent hover:text-accent'"
        @click="priceRange = range"
      >{{ range.label }}</button>
    </div>

    <input
      v-model="keyword"
      type="text"
      placeholder="단지명, 지역 키워드 검색"
      class="w-full px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
    />
  </div>
</template>
