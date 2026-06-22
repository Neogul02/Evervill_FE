<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import type { MarketProperty } from '@/types'
import AppHeader from '@/components/layout/AppHeader.vue'
import MarketListPanel from '@/components/market/MarketListPanel.vue'
import MarketDetailPanel from '@/components/market/MarketDetailPanel.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const selectedPropertyId = ref<number | null>(null)
const { isDesktop } = useBreakpoint()

function onSelect(property: MarketProperty) {
  selectedPropertyId.value = property.id
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-canvas-soft dark:bg-dark-base">
    <AppHeader />
    <main class="flex-1 overflow-hidden pt-14 flex justify-center">
      <div class="flex w-full max-w-[1600px] h-full">
        <aside
          v-if="isDesktop || selectedPropertyId === null"
          class="shrink-0 border-r border-hairline dark:border-dark-border overflow-hidden flex flex-col bg-canvas dark:bg-dark-surface"
          :class="isDesktop ? 'w-110' : 'w-full'"
        >
          <MarketListPanel :selected-id="selectedPropertyId" @select="onSelect" />
        </aside>
        <section
          v-if="isDesktop || selectedPropertyId !== null"
          class="flex-1 overflow-hidden relative"
        >
          <button
            v-if="!isDesktop"
            type="button"
            class="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border px-3 py-1.5 text-sm text-ink dark:text-dark-ink shadow-sm active:scale-95 transition-colors duration-150"
            @click="selectedPropertyId = null"
          >
            <ChevronLeft class="w-4 h-4" />
            목록으로
          </button>
          <MarketDetailPanel :property-id="selectedPropertyId" />
        </section>
      </div>
    </main>
  </div>
</template>
