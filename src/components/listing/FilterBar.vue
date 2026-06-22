<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ListingFilter, DealType } from '@/types'

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
  { label: '1~3억', min: 10000, max: 30000 },
  { label: '3~5억', min: 30000, max: 50000 },
  { label: '5~10억', min: 50000, max: 100000 },
  { label: '10억 이상', min: 100000, max: undefined },
]

const priceRange = ref(PRICE_RANGES[0])
let keywordTimer: ReturnType<typeof setTimeout> | undefined

function emitUpdate() {
  emit('update', {
    dealType: dealType.value,
    minPrice: priceRange.value.min,
    maxPrice: priceRange.value.max,
    address: keyword.value.trim() || undefined,
  })
}

watch([dealType, priceRange], emitUpdate)
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
      <button
        v-for="item in DEAL_TYPES"
        :key="item.label"
        class="px-3 py-1 text-xs rounded-full border font-medium transition-colors cursor-pointer active:scale-95"
        :class="
          dealType === item.value
            ? 'bg-accent text-white border-accent'
            : 'bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted border-hairline dark:border-dark-border hover:border-accent hover:text-accent'
        "
        @click="dealType = item.value"
      >
        {{ item.label }}
      </button>
    </div>

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
      placeholder="제목, 주소 키워드 검색"
      class="w-full px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
    />
  </div>
</template>
