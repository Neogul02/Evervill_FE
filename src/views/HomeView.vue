<script setup lang="ts">
import { ref } from 'vue'
import type { Listing } from '@/types'
import AppHeader from '@/components/layout/AppHeader.vue'
import ListingListPanel from '@/components/listing/ListingListPanel.vue'
import ListingDetailPanel from '@/components/listing/ListingDetailPanel.vue'

const selectedListingId = ref<number | null>(null)

function onSelectListing(listing: Listing) {
  selectedListingId.value = listing.id
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-canvas-soft dark:bg-dark-base">
    <AppHeader />

    <main class="flex flex-1 overflow-hidden pt-14">
      <!-- 왼쪽: 매물 목록 -->
      <aside class="w-110 shrink-0 border-r border-hairline dark:border-dark-border overflow-hidden flex flex-col bg-canvas dark:bg-dark-surface">
        <ListingListPanel
          :selected-id="selectedListingId"
          @select="onSelectListing"
        />
      </aside>

      <!-- 오른쪽: 매물 상세 -->
      <section class="flex-1 overflow-hidden bg-canvas-soft dark:bg-dark-base">
        <ListingDetailPanel :listing-id="selectedListingId" />
      </section>
    </main>
  </div>
</template>
