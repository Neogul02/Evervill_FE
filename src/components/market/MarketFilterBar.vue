<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MarketFilter, MarketDealType, MarketPropertyType } from '@/types'

const emit = defineEmits<{
  update: [filter: MarketFilter]
}>()

const dealType = ref<MarketDealType | undefined>(undefined)
const propertyType = ref<MarketPropertyType | undefined>(undefined)
const maxPrice = ref<number>(0)

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

watch([dealType, propertyType, maxPrice], () => {
  emit('update', {
    dealType: dealType.value,
    propertyType: propertyType.value,
    maxPrice: maxPrice.value || undefined,
  })
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
    <!-- 최대 가격 -->
    <div class="flex items-center gap-3">
      <span class="text-xs text-ink-muted dark:text-dark-muted shrink-0">최대가격</span>
      <input
        v-model.number="maxPrice"
        type="range" min="0" max="200000" step="5000"
        class="flex-1 h-1.5 accent-accent cursor-pointer"
      />
      <span class="text-xs font-medium text-ink-secondary dark:text-dark-text w-14 text-right tabular-nums">
        {{ maxPrice ? `${(maxPrice / 10000).toFixed(0)}억` : '제한없음' }}
      </span>
    </div>
  </div>
</template>
