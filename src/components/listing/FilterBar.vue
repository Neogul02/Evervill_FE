<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ListingFilter, DealType } from '@/types'

const emit = defineEmits<{
  update: [filter: ListingFilter]
}>()

const dealType = ref<DealType | undefined>(undefined)
const maxPrice = ref<number | undefined>(undefined)

const DEAL_TYPES: { value: DealType | undefined; label: string }[] = [
  { value: undefined, label: '거래전체' },
  { value: 'MONTHLY', label: '월세' },
  { value: 'JEONSE', label: '전세' },
  { value: 'SALE', label: '매매' },
]

watch([dealType, maxPrice], () => {
  emit('update', {
    dealType: dealType.value,
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

    <div class="flex items-center gap-3">
      <span class="text-xs text-ink-muted dark:text-dark-muted shrink-0">최대</span>
      <input
        v-model.number="maxPrice"
        type="range"
        min="0"
        max="200000"
        step="5000"
        class="flex-1 h-1.5 accent-accent cursor-pointer"
      />
      <span class="text-xs font-medium text-ink-secondary dark:text-dark-text w-16 text-right tabular-nums">
        {{ maxPrice ? `${(maxPrice / 10000).toFixed(0)}억` : '제한없음' }}
      </span>
    </div>
  </div>
</template>
