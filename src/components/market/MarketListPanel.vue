<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { MarketProperty, MarketFilter } from '@/types'
import { marketApi } from '@/api'
import MarketFilterBar from './MarketFilterBar.vue'
import MarketCard from './MarketCard.vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const emit = defineEmits<{
  select: [property: MarketProperty]
  loaded: [properties: MarketProperty[]]
}>()

const props = defineProps<{
  selectedId?: number | null
}>()

const properties = ref<MarketProperty[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(0)
const hasNext = ref(false)
const filter = ref<MarketFilter>({ page: 0, size: 20 })

const totalPages = computed(() => Math.ceil(total.value / (filter.value.size ?? 20)))
const hasPrev = computed(() => currentPage.value > 0)

async function fetchMarket(page = currentPage.value) {
  loading.value = true
  try {
    const res = await marketApi.getList({ ...filter.value, page })
    const d = res.data.data
    properties.value = d.content
    total.value = d.totalCount
    hasNext.value = d.hasNext
    currentPage.value = page
    emit('loaded', d.content)
  } catch {
    properties.value = []
  } finally {
    loading.value = false
  }
}

function onFilterUpdate(newFilter: MarketFilter) {
  currentPage.value = 0
  filter.value = { ...filter.value, ...newFilter, page: 0 }
}

function goToPage(page: number) {
  fetchMarket(page)
}

const jumpPage = ref('')

function submitJumpPage() {
  const target = Number(jumpPage.value)
  if (!target || target < 1 || target > totalPages.value) return
  goToPage(target - 1)
  jumpPage.value = ''
}

watch(filter, () => fetchMarket(0), { deep: true })
onMounted(() => fetchMarket(0))

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
    <MarketFilterBar @update="onFilterUpdate" />
    <div class="px-4 py-2 border-b border-hairline dark:border-dark-border/60 bg-canvas-soft dark:bg-dark-base">
      <p class="text-xs text-ink-faint dark:text-dark-muted">
        총 <span class="font-semibold text-ink-secondary dark:text-dark-text">{{ total.toLocaleString() }}</span>건
      </p>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3 text-ink-faint dark:text-dark-muted">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="text-sm">불러오는 중...</p>
      </div>
      <div v-else-if="properties.length === 0" class="flex flex-col items-center justify-center py-20 gap-2 text-ink-faint dark:text-dark-muted">
        <p class="text-sm">실거래 내역이 없습니다</p>
        <p class="text-xs">필터를 변경해보세요</p>
      </div>
      <template v-else>
        <MarketCard
          v-for="p in properties"
          :key="p.id"
          :property="p"
          :selected="p.id === selectedId"
          @select="emit('select', $event)"
        />
      </template>
    </div>

    <!-- 페이지네이션 -->
    <div
      v-if="totalPages > 1"
      class="shrink-0 flex items-center justify-center gap-1 px-4 py-2.5 border-t border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface"
    >
      <button
        class="p-1 rounded-full text-ink-faint dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated disabled:opacity-30 transition-colors cursor-pointer"
        :disabled="!hasPrev"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
      </button>

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

      <button
        class="p-1 rounded-full text-ink-faint dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated disabled:opacity-30 transition-colors cursor-pointer"
        :disabled="!hasNext"
        @click="goToPage(currentPage + 1)"
      >
        <ChevronRight class="w-3.5 h-3.5" />
      </button>

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
