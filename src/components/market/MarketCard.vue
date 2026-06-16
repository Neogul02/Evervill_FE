<script setup lang="ts">
import type { MarketProperty } from '@/types'
import { formatManWon, formatArea } from '@/utils/format'

const props = defineProps<{
  property: MarketProperty
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [property: MarketProperty]
}>()

const DEAL_LABEL: Record<string, string> = { SALE: '매매', JEONSE: '전세', MONTHLY_RENT: '월세' }
const DEAL_COLOR: Record<string, string> = {
  SALE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  JEONSE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  MONTHLY_RENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

function formatPrice(p: MarketProperty): string {
  if (p.dealType === 'MONTHLY_RENT') return `${formatManWon(p.dealAmount)} / 월 ${p.monthlyRent?.toLocaleString() ?? '-'}만`
  return formatManWon(p.dealAmount)
}
</script>

<template>
  <div
    class="px-4 py-3.5 border-b border-hairline dark:border-dark-border/60 cursor-pointer transition-colors hover:bg-canvas-soft dark:hover:bg-dark-elevated"
    :class="selected ? 'bg-accent-light dark:bg-accent-dark-muted border-l-2 border-l-accent' : ''"
    @click="emit('select', property)"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="DEAL_COLOR[property.dealType]">
            {{ DEAL_LABEL[property.dealType] }}
          </span>
          <span class="text-xs text-ink-faint dark:text-dark-muted truncate">
            {{ property.districtName }}
          </span>
        </div>
        <p class="text-sm font-medium text-ink-secondary dark:text-dark-text truncate">{{ property.propertyName }}</p>
        <p class="text-sm font-bold text-ink dark:text-dark-text">{{ formatPrice(property) }}</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-xs text-ink-faint dark:text-dark-muted">{{ property.dealYear }}.{{ String(property.dealMonth).padStart(2,'0') }}.{{ String(property.dealDay).padStart(2,'0') }}</p>
        <p class="text-xs text-ink-muted dark:text-dark-muted mt-0.5">{{ formatArea(property.area) }}</p>
      </div>
    </div>
    <p v-if="property.floor" class="mt-1 text-xs text-ink-faint dark:text-dark-muted">{{ property.floor }}층</p>
  </div>
</template>
