<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ListingFilter, DealType } from '@/types'

const emit = defineEmits<{
  update: [filter: ListingFilter]
}>()

const dealType = ref<DealType | undefined>(undefined)
const minPrice = ref<number | undefined>(undefined)
const maxPrice = ref<number | undefined>(undefined)

const DEAL_TYPES: { value: DealType | undefined; label: string }[] = [
  { value: undefined, label: '거래전체' },
  { value: 'MONTHLY_RENT', label: '월세' },
  { value: 'JEONSE', label: '전세' },
  { value: 'SALE', label: '매매' },
]

const PRICE_PRESETS = [
  { label: '1억', value: 10000 },
  { label: '5억', value: 50000 },
  { label: '10억', value: 100000 },
]

function applyPricePreset(value: number) {
  maxPrice.value = maxPrice.value === value ? undefined : value
}

watch([dealType, minPrice, maxPrice], () => {
  emit('update', {
    dealType: dealType.value,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
  })
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
        v-for="preset in PRICE_PRESETS"
        :key="preset.label"
        class="px-3 py-1 text-xs rounded-full border font-medium transition-colors cursor-pointer active:scale-95"
        :class="maxPrice === preset.value
          ? 'bg-accent text-white border-accent'
          : 'bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted border-hairline dark:border-dark-border hover:border-accent hover:text-accent'"
        @click="applyPricePreset(preset.value)"
      >{{ preset.label }} 이하</button>
    </div>

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
