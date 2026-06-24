<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { animate, stagger } from 'animejs'
import type { Listing, ListingFilter } from '@/types'
import { listingsApi } from '@/api'
import FilterBar from './FilterBar.vue'
import ListingCard from './ListingCard.vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import IconButton from '@/components/ui/IconButton.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'

const emit = defineEmits<{
  select: [listing: Listing]
  'page-change': [page: number]
}>()

const props = defineProps<{
  selectedId?: number | null
  initialPage?: number
}>()

const route = useRoute()

const listings = ref<Listing[]>([])
const { loading, run } = useAsyncAction()
const currentPage = ref(props.initialPage ?? 0)
const totalCount = ref(0)
const hasNextPage = ref(false)
const filter = ref<ListingFilter>({
  address: (route.query.address as string) || undefined,
  size: 20,
})

const totalPages = computed(() => Math.ceil(totalCount.value / (filter.value.size ?? 20)))
const hasPrev = computed(() => currentPage.value > 0)

async function fetchListings(page = currentPage.value) {
  await run(async () => {
    const res = await listingsApi.getList({ ...filter.value, page })
    const d = res.data.data
    listings.value = d.content
    totalCount.value = d.totalCount
    hasNextPage.value = d.hasNext
    currentPage.value = page
  }).catch(() => {
    listings.value = []
  })
}

function onFilterUpdate(newFilter: ListingFilter) {
  currentPage.value = 0
  filter.value = { ...filter.value, ...newFilter }
}

function goToPage(page: number) {
  fetchListings(page)
  emit('page-change', page)
}

const jumpPage = ref('')

function submitJumpPage() {
  const target = Number(jumpPage.value)
  if (!target || target < 1 || target > totalPages.value) return
  goToPage(target - 1)
  jumpPage.value = ''
}

watch(filter, () => fetchListings(0), { deep: true })

watch(() => route.query.address, (addr) => {
  filter.value = { ...filter.value, address: (addr as string) || undefined }
  currentPage.value = 0
})

onMounted(() => fetchListings(props.initialPage ?? 0))

function onCardEnter(el: Element, done: () => void) {
  animate(el, {
    translateY: [16, 0],
    opacity: [0, 1],
    duration: 300,
    delay: stagger(35),
    ease: 'outCubic',
    onComplete: done,
  })
}
function onCardLeave(el: Element, done: () => void) {
  animate(el, { opacity: [1, 0], duration: 150, onComplete: done })
}

const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 0) return []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const cur = currentPage.value
  const pages: (number | '...')[] = [0]
  if (cur > 2) pages.push('...')
  for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i)
  if (cur < total - 3) pages.push('...')
  pages.push(total - 1)
  return pages
})
</script>

<template>
  <div class="flex flex-col h-full bg-canvas dark:bg-dark-surface">
    <FilterBar @update="onFilterUpdate" />

    <div class="flex-1 overflow-y-auto scrollbar-hide">
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20 gap-3 text-ink-faint dark:text-dark-muted"
      >
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm">불러오는 중...</p>
      </div>
      <div
        v-else-if="listings.length === 0"
        class="flex flex-col items-center justify-center py-20 gap-3 text-ink-faint dark:text-dark-muted"
      >
        <p class="text-sm">매물이 없습니다</p>
        <p class="text-xs">필터를 변경해보세요</p>
      </div>
      <TransitionGroup v-else tag="div" :css="false" appear @enter="onCardEnter" @leave="onCardLeave">
        <ListingCard
          v-for="listing in listings"
          :key="listing.id"
          :listing="listing"
          :selected="listing.id === selectedId"
          @select="emit('select', $event)"
        />
      </TransitionGroup>
    </div>

    <!-- 페이지네이션 -->
    <div
      v-if="totalPages > 1"
      class="shrink-0 flex items-center justify-center gap-1 px-4 py-2.5 border-t border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface"
    >
      <IconButton
        aria-label="이전 페이지"
        :class="{ 'opacity-30 pointer-events-none': !hasPrev }"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
      </IconButton>

      <template v-for="(p, i) in pageNumbers" :key="i">
        <span v-if="p === '...'" class="w-6 text-center text-xs text-ink-faint dark:text-dark-muted">…</span>
        <button
          v-else
          class="w-6 h-6 text-xs rounded transition-colors cursor-pointer"
          :class="p === currentPage
            ? 'bg-accent text-white font-medium'
            : 'text-ink-muted dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated'"
          @click="goToPage(p as number)"
        >{{ (p as number) + 1 }}</button>
      </template>

      <IconButton
        aria-label="다음 페이지"
        :class="{ 'opacity-30 pointer-events-none': !hasNextPage }"
        @click="goToPage(currentPage + 1)"
      >
        <ChevronRight class="w-3.5 h-3.5" />
      </IconButton>

      <form v-if="totalPages > 7" class="flex items-center gap-1 ml-2" @submit.prevent="submitJumpPage">
        <input
          v-model="jumpPage"
          type="number"
          min="1"
          :max="totalPages"
          placeholder="페이지"
          class="w-14 px-1.5 py-0.5 text-xs border border-hairline dark:border-dark-border rounded bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
        />
        <button type="submit" class="text-xs text-accent hover:underline cursor-pointer shrink-0">이동</button>
      </form>
    </div>
  </div>
</template>
