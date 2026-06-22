<script setup lang="ts">
import { ref, watch } from 'vue'
import type { MarketFilter, MarketDealType, MarketPropertyType } from '@/types'

const emit = defineEmits<{
  update: [filter: MarketFilter]
}>()

const dealType = ref<MarketDealType | undefined>(undefined)
const propertyType = ref<MarketPropertyType | undefined>(undefined)
const minPrice = ref<number | undefined>(undefined)
const maxPrice = ref<number>(0)

const PRICE_PRESETS = [
  { label: '1억', value: 10000 },
  { label: '5억', value: 50000 },
  { label: '10억', value: 100000 },
]

function applyPricePreset(value: number) {
  maxPrice.value = maxPrice.value === value ? 0 : value
}

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

watch([dealType, propertyType, minPrice, maxPrice], () => {
  emit('update', {
    dealType: dealType.value,
    propertyType: propertyType.value,
    minPrice: minPrice.value,
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
    <!-- 가격 프리셋 -->
    <div class="flex gap-1.5 flex-wrap">
      <button
        v-for="preset in PRICE_PRESETS"
        :key="preset.label"
        class="px-3 py-1 text-xs rounded-full border font-medium transition-colors cursor-pointer active:scale-95"
        :class="maxPrice === preset.value
          ? 'bg-accent text-white border-accent'
          : 'bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted border-hairline dark:border-dark-border hover:border-accent hover:text-accent'"
        @click="applyPricePreset(preset.value)"
      >{{ preset.label }} 이하</button>
    </div>

    <!-- 가격 범위 -->
    <div class="flex items-center gap-2">
      <input
        v-model.number="minPrice"
        type="number"
        min="0"
        placeholder="최소 (만원)"
        class="flex-1 px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
      />
      <span class="text-xs text-ink-faint dark:text-dark-muted">~</span>
      <input
        v-model.number="maxPrice"
        type="number"
        min="0"
        placeholder="최대 (만원)"
        class="flex-1 px-2.5 py-1.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
      />
    </div>
  </div>
</template>
