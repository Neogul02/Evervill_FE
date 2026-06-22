<script setup lang="ts">
import type { Listing } from '@/types'
import { formatListingPrice, formatArea, formatFloor, DEAL_TYPE_LABEL, STATUS_LABEL } from '@/utils/format'
import Badge from '@/components/ui/Badge.vue'
import { DEAL_TYPE_TONE, STATUS_TONE } from '@/constants/dealTypeColors'

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
          <Badge :tone="DEAL_TYPE_TONE[listing.dealType]">{{ DEAL_TYPE_LABEL[listing.dealType] }}</Badge>
          <Badge :tone="STATUS_TONE[listing.status]">{{ STATUS_LABEL[listing.status] }}</Badge>
        </div>

        <p class="text-sm font-semibold text-ink dark:text-dark-text truncate">{{ listing.title }}</p>
        <p class="text-xs text-ink-faint dark:text-dark-muted truncate">{{ listing.address }}</p>
        <p class="text-sm font-bold text-ink dark:text-dark-text">{{ formatListingPrice(listing) }}</p>
        <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">
          {{ formatArea(listing.area) }} · {{ formatFloor(listing.floor) }}
        </p>
      </div>
    </div>
  </div>
</template>
