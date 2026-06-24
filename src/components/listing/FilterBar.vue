<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ListingFilter, DealType } from '@/types'
import FilterChip from '@/components/ui/FilterChip.vue'

const emit = defineEmits<{
  update: [filter: ListingFilter]
}>()

const route = useRoute()
const dealType = ref<DealType | undefined>(undefined)
const keyword = ref((route.query.address as string) ?? '')

const DEAL_TYPES: { value: DealType | undefined; label: string }[] = [
  { value: undefined, label: '거래전체' },
  { value: 'MONTHLY_RENT', label: '월세' },
  { value: 'JEONSE', label: '전세' },
  { value: 'SALE', label: '매매' },
]

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: '전체', min: undefined, max: undefined },
  { label: '1억 이하', min: undefined, max: 10000 },
  { label: '1~5억', min: 10000, max: 50000 },
  { label: '5~10억', min: 50000, max: 100000 },
  { label: '10억 이상', min: 100000, max: undefined },
]

const priceRange = ref(PRICE_RANGES[0])
let keywordTimer: ReturnType<typeof setTimeout> | undefined

const YEARS = [2026, 2025]
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

const year = ref<number | undefined>(undefined)
const month = ref<number | undefined>(undefined)

function emitUpdate() {
  const q = keyword.value.trim() || undefined
  emit('update', {
    dealType: dealType.value,
    minPrice: priceRange.value.min,
    maxPrice: priceRange.value.max,
    year: year.value,
    month: month.value,
    address: q,
    keyword: q,
  })
}

watch([dealType, priceRange, year, month], emitUpdate)
watch(keyword, () => {
  clearTimeout(keywordTimer)
  keywordTimer = setTimeout(emitUpdate, 400)
})
watch(() => route.query.address, (addr) => {
  keyword.value = (addr as string) ?? ''
})
</script>

<template>
  <div class="px-4 py-3 border-b border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface space-y-3">
    <div class="flex gap-1.5 flex-wrap">
      <FilterChip
        v-for="item in DEAL_TYPES"
        :key="item.label"
        :active="dealType === item.value"
        @click="dealType = item.value"
      >{{ item.label }}</FilterChip>
    </div>

    <div class="flex gap-1.5 flex-wrap">
      <FilterChip
        v-for="range in PRICE_RANGES"
        :key="range.label"
        :active="priceRange.label === range.label"
        @click="priceRange = range"
      >{{ range.label }}</FilterChip>
    </div>

    <div class="flex gap-1.5">
      <select
        v-model="year"
        class="flex-1 px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent cursor-pointer"
      >
        <option :value="undefined">등록연도 전체</option>
        <option v-for="y in YEARS" :key="y" :value="y">{{ y }}년</option>
      </select>
      <select
        v-model="month"
        class="flex-1 px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent cursor-pointer"
      >
        <option :value="undefined">월 전체</option>
        <option v-for="m in MONTHS" :key="m" :value="m">{{ m }}월</option>
      </select>
    </div>

    <input
      v-model="keyword"
      type="text"
      placeholder="제목, 주소 키워드 검색"
      class="w-full px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
    />
  </div>
</template>

