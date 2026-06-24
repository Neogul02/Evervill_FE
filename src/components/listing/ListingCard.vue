<script setup lang="ts">
import type { Listing } from '@/types'
import {
  formatListingPrice,
  formatArea,
  formatFloor,
  DEAL_TYPE_LABEL,
  STATUS_LABEL,
} from '@/utils/format'
import Badge from '@/components/ui/Badge.vue'
import { DEAL_TYPE_TONE, STATUS_TONE } from '@/constants/dealTypeColors'
import { ImageOff, Heart, UserRound } from 'lucide-vue-next'

const props = defineProps<{
  listing: Listing
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [listing: Listing]
}>()

const convertToK = (value: number | undefined) => {
  if (value === undefined) return ''
  if (value < 1000) return value
  if (value < 10000) return (value / 1000).toFixed(1) + 'K'
  if (value < 1000000) return Math.floor(value / 1000) + 'K'
  if (value < 10000000) return (value / 1000000).toFixed(1) + 'M'
  if (value < 1000000000) return Math.floor(value / 1000000) + 'M'
}
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
      <div class="w-16 shrink-0 flex flex-col gap-1">
        <div
          v-if="listing.images[0]?.imageUrl"
          class="w-16 h-16 rounded-lg bg-canvas-soft dark:bg-dark-elevated overflow-hidden"
        >
          <img
            :src="listing.images[0].imageUrl"
            :alt="listing.title"
            loading="lazy"
            decoding="async"
            class="w-full h-full object-cover"
          />
        </div>
        <div
          v-else
          class="w-16 h-16 rounded-lg border border-dashed border-hairline dark:border-dark-border bg-canvas-soft dark:bg-dark-elevated flex flex-col items-center justify-center gap-0.5 text-ink-faint dark:text-dark-muted"
        >
          <ImageOff class="w-4 h-4" />
          <span class="text-[10px]">사진없음</span>
        </div>
        <div
          class="flex flex-col justify-center gap-1 text-[11px] text-ink-faint dark:text-dark-muted"
        >
          <div class="flex gap-1">
            <UserRound class="w-3.5 h-3.5" />
            {{ convertToK(listing.viewCount) }}
          </div>
          <div class="flex gap-1">
            <Heart class="w-3.5 h-3.5" />
            {{ listing.bookmarkCount }}
          </div>
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 mb-1">
          <Badge :tone="DEAL_TYPE_TONE[listing.dealType]">{{
            DEAL_TYPE_LABEL[listing.dealType]
          }}</Badge>
          <Badge
            v-if="STATUS_LABEL[listing.status]"
            :tone="STATUS_TONE[listing.status]"
            >{{ STATUS_LABEL[listing.status] }}</Badge
          >
        </div>

        <p class="text-sm font-semibold text-ink dark:text-dark-text truncate">
          {{ listing.title }}
        </p>
        <p class="text-xs text-ink-faint dark:text-dark-muted truncate">
          {{ listing.address }}
        </p>
        <p class="text-sm font-bold text-ink dark:text-dark-text">
          {{ formatListingPrice(listing) }}
        </p>
        <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">
          {{ formatArea(listing.area) }} · {{ formatFloor(listing.floor) }}
        </p>
      </div>
    </div>
  </div>
</template>
