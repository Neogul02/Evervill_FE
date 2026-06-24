<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import type { MarketProperty } from '@/types'
import AppHeader from '@/components/layout/AppHeader.vue'
import MarketListPanel from '@/components/market/MarketListPanel.vue'
import MarketDetailPanel from '@/components/market/MarketDetailPanel.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const route = useRoute()
const router = useRouter()
const { isDesktop } = useBreakpoint()

// '/market' 또는 '/market/:id' 둘 다 이 컴포넌트가 렌더되므로, 선택 상태는
// 라우트 파라미터에서 직접 파생한다 — 공유된 '/market/:id' 링크로 바로
// 들어와도 같은 split 화면이 뜨도록 ListingDetail과 동일한 패턴을 따른다.
const selectedPropertyId = computed(() => {
  const id = Number(route.params.id)
  return route.params.id && !Number.isNaN(id) ? id : null
})

function onSelect(property: MarketProperty) {
  router.push(`/market/${property.id}`)
}

function backToList() {
  router.push('/market')
}
</script>

<template>
  <div
    class="flex flex-col h-screen overflow-hidden bg-canvas-soft dark:bg-dark-base"
  >
    <AppHeader />
    <main
      class="flex-1 w-full overflow-hidden pt-14 flex justify-center px-0 sm:px-16 md:px-20 md:mx-auto md:max-w-[1300px]"
    >
      <div class="flex w-full h-full">
        <aside
          v-if="isDesktop || selectedPropertyId === null"
          class="shrink-0 border-r border-hairline dark:border-dark-border overflow-hidden flex flex-col bg-canvas dark:bg-dark-surface"
          :class="isDesktop ? 'w-110' : 'w-full'"
        >
          <MarketListPanel
            :selected-id="selectedPropertyId"
            @select="onSelect"
          />
        </aside>
        <section
          v-if="isDesktop || selectedPropertyId !== null"
          class="flex-1 overflow-hidden relative"
        >
          <button
            v-if="!isDesktop"
            type="button"
            class="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border px-3 py-1.5 text-sm text-ink dark:text-dark-text shadow-sm active:scale-95 transition-colors duration-150"
            @click="backToList"
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
