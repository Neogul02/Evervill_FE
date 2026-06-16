<script setup lang="ts">
import { ref } from 'vue'
import type { MarketProperty } from '@/types'
import AppHeader from '@/components/layout/AppHeader.vue'
import MarketListPanel from '@/components/market/MarketListPanel.vue'
import MarketDetailPanel from '@/components/market/MarketDetailPanel.vue'

const selectedPropertyId = ref<number | null>(null)

function onSelect(property: MarketProperty) {
  selectedPropertyId.value = property.id
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-canvas-soft dark:bg-dark-base">
    <AppHeader />
    <main class="flex flex-1 overflow-hidden pt-14">
      <aside class="w-110 shrink-0 border-r border-hairline dark:border-dark-border overflow-hidden flex flex-col bg-canvas dark:bg-dark-surface">
        <MarketListPanel :selected-id="selectedPropertyId" @select="onSelect" />
      </aside>
      <section class="flex-1 overflow-hidden">
        <MarketDetailPanel :property-id="selectedPropertyId" />
      </section>
    </main>
  </div>
</template>
