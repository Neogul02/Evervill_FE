<script setup lang="ts">
import type { Listing } from '@/types'
import { formatListingPrice, formatArea, formatFloor, DEAL_TYPE_LABEL } from '@/utils/format'

const props = defineProps<{
  listing: Listing
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [listing: Listing]
}>()
</script>

<template>
  <div
    class="px-4 py-3.5 border-b border-hairline dark:border-dark-border/60 cursor-pointer transition-colors active:scale-[0.99]"
    :class="
      selected
        ? 'bg-accent-light dark:bg-accent-dark-muted border-l-[3px] border-l-accent'
        : 'hover:bg-canvas-soft dark:hover:bg-dark-elevated'
    "
    @click="emit('select', listing)"
  >
    <div class="flex gap-3">
      <!-- 썸네일 -->
      <div
        v-if="listing.images[0]?.imageUrl"
        class="w-16 h-16 rounded-lg bg-canvas-soft dark:bg-dark-elevated shrink-0 overflow-hidden"
      >
        <img :src="listing.images[0].imageUrl" :alt="listing.title" class="w-full h-full object-cover" />
      </div>
      <div
        v-else
        class="w-16 h-16 rounded-lg bg-canvas-soft dark:bg-dark-elevated shrink-0 flex items-center justify-center text-ink-faint dark:text-dark-muted text-xs"
      >
        사진없음
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 mb-1">
          <span
            class="text-xs px-2 py-0.5 rounded-full font-semibold"
            :class="{
              'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400': listing.dealType === 'MONTHLY_RENT',
              'bg-accent-light dark:bg-accent-dark-muted text-accent': listing.dealType === 'JEONSE',
              'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400': listing.dealType === 'SALE',
            }"
          >
            {{ DEAL_TYPE_LABEL[listing.dealType] }}
          </span>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-medium"
            :class="{
              'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400': listing.status === 'ACTIVE',
              'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400': listing.status === 'RESERVED',
              'bg-canvas-soft dark:bg-dark-elevated text-ink-muted dark:text-dark-muted': listing.status === 'CLOSED',
            }"
          >
            {{ listing.status === 'ACTIVE' ? '거래가능' : listing.status === 'RESERVED' ? '예약중' : '거래완료' }}
          </span>
        </div>

        <p class="text-sm font-semibold text-ink dark:text-dark-text truncate">
          {{ listing.district }} {{ listing.neighborhood }}
        </p>
        <p class="text-sm font-bold text-ink dark:text-dark-text">{{ formatListingPrice(listing) }}</p>
        <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">
          {{ formatArea(listing.area) }} · {{ formatFloor(listing.floor) }}
        </p>
      </div>
    </div>
  </div>
</template>
