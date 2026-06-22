<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import type { Listing } from '@/types'
import AppHeader from '@/components/layout/AppHeader.vue'
import ListingListPanel from '@/components/listing/ListingListPanel.vue'
import ListingDetailPanel from '@/components/listing/ListingDetailPanel.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const selectedListingId = ref<number | null>(null)
const { isDesktop } = useBreakpoint()

function onSelectListing(listing: Listing) {
  selectedListingId.value = listing.id
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-canvas-soft dark:bg-dark-base">
    <AppHeader />

    <main class="flex flex-1 overflow-hidden pt-14">
      <!-- 왼쪽: 매물 목록 -->
      <aside
        v-if="isDesktop || selectedListingId === null"
        class="shrink-0 border-r border-hairline dark:border-dark-border overflow-hidden flex flex-col bg-canvas dark:bg-dark-surface"
        :class="isDesktop ? 'w-110' : 'w-full'"
      >
        <ListingListPanel
          :selected-id="selectedListingId"
          @select="onSelectListing"
        />
      </aside>

      <!-- 오른쪽: 매물 상세 -->
      <section
        v-if="isDesktop || selectedListingId !== null"
        class="flex-1 overflow-hidden bg-canvas-soft dark:bg-dark-base relative"
      >
        <button
          v-if="!isDesktop"
          type="button"
          class="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border px-3 py-1.5 text-sm text-ink dark:text-dark-ink shadow-sm active:scale-95 transition-colors duration-150"
          @click="selectedListingId = null"
        >
          <ChevronLeft class="w-4 h-4" />
          목록으로
        </button>
        <ListingDetailPanel :listing-id="selectedListingId" />
      </section>
    </main>
  </div>
</template>
