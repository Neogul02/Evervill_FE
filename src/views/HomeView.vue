<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import type { Listing } from '@/types'
import AppHeader from '@/components/layout/AppHeader.vue'
import ListingListPanel from '@/components/listing/ListingListPanel.vue'
import ListingDetailPanel from '@/components/listing/ListingDetailPanel.vue'
import { useBreakpoint } from '@/composables/useBreakpoint'

const route = useRoute()
const router = useRouter()
const { isDesktop } = useBreakpoint()

// '/' 또는 '/listings/:id' 둘 다 이 컴포넌트가 렌더되므로, 선택 상태는
// 로컬 ref가 아니라 라우트 파라미터에서 직접 파생한다 — 그래야 공유된
// '/listings/:id' 링크로 바로 들어와도 같은 split 화면이 뜬다.
const selectedListingId = computed(() => {
  const id = Number(route.params.id)
  return route.params.id && !Number.isNaN(id) ? id : null
})

function onSelectListing(listing: Listing) {
  router.push(`/listings/${listing.id}`)
}

function backToList() {
  router.push('/')
}
</script>

<template>
  <div
    class="flex flex-col h-screen overflow-hidden bg-canvas-soft dark:bg-dark-base"
  >
    <AppHeader />

    <main
      class="flex-1 w-full overflow-hidden pt-14 flex justify-center px-0 sm:px-16 md:px-20 md:mx-auto md:max-w-[1300px] "
    >
      <div class="flex w-full h-full">
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

        <!-- 오른쪽: 매물 상세 (고정 레이아웃 — 항목이 바뀌어도 패널 크기는 유지) -->
        <section
          v-if="isDesktop || selectedListingId !== null"
          class="flex-1 min-w-0 md:min-w-[480px] overflow-hidden bg-canvas-soft dark:bg-dark-base relative"
        >
          <button
            v-if="!isDesktop"
            type="button"
            class="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border px-3 py-1.5 text-sm text-ink dark:text-dark-ink shadow-sm active:scale-95 transition-colors duration-150"
            @click="backToList"
          >
            <ChevronLeft class="w-4 h-4" />
            목록으로
          </button>
          <ListingDetailPanel :listing-id="selectedListingId" />
        </section>
      </div>
    </main>
  </div>
</template>
