<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MarketFilter, MarketDealType, MarketPropertyType } from '@/types'
import FilterChip from '@/components/ui/FilterChip.vue'

const emit = defineEmits<{
  update: [filter: MarketFilter]
}>()

const dealType = ref<MarketDealType | undefined>(undefined)
const propertyType = ref<MarketPropertyType | undefined>(undefined)
const keyword = ref('')

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: '전체', min: undefined, max: undefined },
  { label: '1억 이하', min: undefined, max: 10000 },
  { label: '1~5억', min: 10000, max: 50000 },
  { label: '5~10억', min: 50000, max: 100000 },
  { label: '10억 이상', min: 100000, max: undefined },
]

const priceRange = ref(PRICE_RANGES[0])
let keywordTimer: ReturnType<typeof setTimeout> | undefined

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

const dealYear = ref<number | undefined>(undefined)
const dealMonth = ref<number | undefined>(undefined)

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
    dealYear: dealYear.value,
    dealMonth: dealMonth.value,
    keyword: keyword.value.trim() || undefined,
  })
}

watch([dealType, propertyType, priceRange, dealYear, dealMonth], emitUpdate)
watch(keyword, () => {
  clearTimeout(keywordTimer)
  keywordTimer = setTimeout(emitUpdate, 400)
})
</script>

<template>
  <div class="px-4 py-3 border-b border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface space-y-3">
    <!-- 거래 유형 -->
    <div class="flex gap-1.5 flex-wrap">
      <FilterChip
        v-for="item in DEAL_TYPES"
        :key="item.label"
        :active="dealType === item.value"
        @click="dealType = item.value"
      >{{ item.label }}</FilterChip>
    </div>
    <!-- 건물 유형 -->
    <div class="flex gap-1.5 flex-wrap">
      <FilterChip
        v-for="item in PROPERTY_TYPES"
        :key="item.label"
        :active="propertyType === item.value"
        @click="propertyType = item.value"
      >{{ item.label }}</FilterChip>
    </div>
    <!-- 가격 범위 -->
    <div class="flex gap-1.5 flex-wrap">
      <FilterChip
        v-for="range in PRICE_RANGES"
        :key="range.label"
        :active="priceRange.label === range.label"
        @click="priceRange = range"
      >{{ range.label }}</FilterChip>
    </div>

    <!-- 거래 연/월 -->
    <div class="flex gap-1.5">
      <select
        v-model="dealYear"
        class="flex-1 px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
      >
        <option :value="undefined">거래연도 전체</option>
        <option v-for="y in YEARS" :key="y" :value="y">{{ y }}년</option>
      </select>
      <select
        v-model="dealMonth"
        class="flex-1 px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
      >
        <option :value="undefined">월 전체</option>
        <option v-for="m in MONTHS" :key="m" :value="m">{{ m }}월</option>
      </select>
    </div>

    <input
      v-model="keyword"
      type="text"
      placeholder="단지명, 지역 키워드 검색"
      class="w-full px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
    />
  </div>
</template>

