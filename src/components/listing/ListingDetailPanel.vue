<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import type { Listing, MarketProperty } from '@/types'
import type { AiAnalysis } from '@/types/ai'
import { listingsApi, marketApi, aiApi } from '@/api'
import { formatListingPrice, formatArea, formatFloor, formatManWon, DEAL_TYPE_LABEL } from '@/utils/format'
import NaverMap from '@/components/map/NaverMap.vue'
import { useAuthStore } from '@/stores'

const props = defineProps<{
  listingId: number | null
}>()

const authStore = useAuthStore()
const router = useRouter()
const detail = ref<Listing | null>(null)
const aiResult = ref<AiAnalysis | null>(null)
const aiLoading = ref(false)
const aiError = ref('')

const AI_LEVEL_COLOR: Record<string, string> = {
  SAFE:    'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
  CAUTION: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
  DANGER:  'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
}
const AI_LEVEL_LABEL: Record<string, string> = {
  SAFE: '안전', CAUTION: '주의', DANGER: '위험',
}

async function runAiAnalysis() {
  if (!detail.value || aiLoading.value) return
  aiLoading.value = true
  aiError.value = ''
  aiResult.value = null
  try {
    const res = await aiApi.analyzePrice({ targetId: detail.value.id })
    aiResult.value = res.data
  } catch {
    aiError.value = 'AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    aiLoading.value = false
  }
}
const nearbyMarket = ref<MarketProperty[]>([])
const loading = ref(false)
const bookmarked = ref(false)

watch(
  () => props.listingId,
  async (id) => {
    if (!id) { detail.value = null; aiResult.value = null; return }
    loading.value = true
    aiResult.value = null
    aiError.value = ''
    try {
      const res = await listingsApi.getById(id)
      detail.value = res.data.data
      bookmarked.value = res.data.data.isBookmarked
      const marketRes = await marketApi.getList({ size: 5 })
      nearbyMarket.value = marketRes.data.data.content
    } catch {
      detail.value = null
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

async function toggleBookmark() {
  if (!detail.value || !authStore.isAuthenticated) return
  try {
    if (bookmarked.value) {
      await listingsApi.unbookmark(detail.value.id)
    } else {
      await listingsApi.bookmark(detail.value.id)
    }
    bookmarked.value = !bookmarked.value
  } catch {}
}
</script>

<template>
  <div class="h-full overflow-y-auto bg-canvas-soft dark:bg-dark-base">

    <!-- 미선택 -->
    <div v-if="!listingId" class="flex items-center justify-center h-full text-ink-faint dark:text-dark-muted">
      <div class="text-center space-y-2">
        <p class="text-lg font-semibold text-ink dark:text-dark-text">매물을 선택하세요</p>
        <p class="text-sm">왼쪽 목록에서 매물을 클릭하면 상세 정보가 표시됩니다</p>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-else-if="loading" class="flex flex-col items-center justify-center h-full gap-3 text-ink-faint dark:text-dark-muted">
      <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p class="text-sm">불러오는 중...</p>
    </div>

    <template v-else-if="detail">

      <!-- 헤더 -->
      <div class="p-6 border-b border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs text-ink-faint dark:text-dark-muted mb-1">
              {{ detail.city }} {{ detail.district }} {{ detail.neighborhood }}
            </p>
            <h2 class="text-lg font-bold text-ink dark:text-dark-text tracking-tight">{{ detail.title }}</h2>
            <p class="text-2xl font-bold text-accent mt-1.5">{{ formatListingPrice(detail) }}</p>
          </div>
          <button
            class="shrink-0 px-4 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-pointer active:scale-95"
            :class="
              bookmarked
                ? 'bg-accent-light dark:bg-accent-dark-muted border-accent text-accent'
                : 'border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:border-accent hover:text-accent hover:bg-accent-light dark:hover:bg-accent-dark-muted'
            "
            @click="toggleBookmark"
          >
            {{ bookmarked ? '★ 저장됨' : '☆ 북마크' }}
          </button>
        </div>
      </div>

      <!-- 기본 정보 -->
      <div class="p-6 border-b border-hairline dark:border-dark-border">
        <h3 class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3">기본 정보</h3>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div v-for="(info, i) in [
            { label: '면적', value: formatArea(detail.area) },
            { label: '층수', value: formatFloor(detail.floor) },
          ]" :key="i"
            class="bg-canvas-soft dark:bg-dark-elevated rounded-lg p-3"
          >
            <p class="text-xs text-ink-faint dark:text-dark-muted mb-1">{{ info.label }}</p>
            <p class="text-sm font-semibold text-ink dark:text-dark-text">{{ info.value }}</p>
          </div>
        </div>
      </div>

      <!-- 설명 -->
      <div v-if="detail.description" class="p-6 border-b border-hairline dark:border-dark-border">
        <h3 class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3">매물 설명</h3>
        <p class="text-sm text-ink-muted dark:text-dark-muted whitespace-pre-wrap leading-relaxed">{{ detail.description }}</p>
      </div>

      <!-- 실거래가 비교 -->
      <div v-if="nearbyMarket.length > 0" class="p-6 border-b border-hairline dark:border-dark-border">
        <h3 class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3">인근 실거래가 비교</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-ink-faint dark:text-dark-muted border-b border-hairline dark:border-dark-border">
              <th class="pb-2 text-left font-medium">거래일</th>
              <th class="pb-2 text-left font-medium">유형</th>
              <th class="pb-2 text-right font-medium">가격</th>
              <th class="pb-2 text-right font-medium">면적</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in nearbyMarket"
              :key="item.id"
              class="border-b border-hairline dark:border-dark-border/40 hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
            >
              <td class="py-2 text-ink-muted dark:text-dark-muted">{{ item.dealYear }}.{{ item.dealMonth }}.{{ item.dealDay }}</td>
              <td class="py-2 text-ink-muted dark:text-dark-muted">{{ DEAL_TYPE_LABEL[item.dealType] }}</td>
              <td class="py-2 text-right font-semibold text-ink dark:text-dark-text">{{ formatManWon(item.dealAmount) }}</td>
              <td class="py-2 text-right text-ink-muted dark:text-dark-muted">{{ formatArea(item.area) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 지도 -->
      <div class="p-6 border-b border-hairline dark:border-dark-border">
        <h3 class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3">위치</h3>
        <NaverMap
          :latitude="detail.latitude"
          :longitude="detail.longitude"
          class="w-full h-64 rounded-xl overflow-hidden"
        />
      </div>

      <!-- 판매자 + 채팅 -->
      <div class="p-6">
        <h3 class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3">판매자</h3>
        <div class="flex items-center justify-between">
          <span class="text-sm text-ink-muted dark:text-dark-muted">{{ detail.sellerNickname }}</span>
          <RouterLink
            v-if="authStore.isAuthenticated"
            :to="`/chat?listingId=${detail.id}`"
            class="text-sm font-medium bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-full transition-colors cursor-pointer active:scale-95 shadow-sm"
          >채팅하기</RouterLink>
          <button
            v-else
            class="text-sm font-medium border border-accent text-accent px-4 py-1.5 rounded-full transition-colors cursor-pointer hover:bg-accent-light dark:hover:bg-accent-dark-muted active:scale-95"
            @click="router.push({ path: '/login', query: { redirect: `/chat?listingId=${detail.id}` } })"
          >로그인 후 채팅</button>
        </div>
      </div>

      <!-- AI 가격 분석 -->
      <div v-if="authStore.isAuthenticated" class="px-6 pb-6">
        <div class="border border-hairline dark:border-dark-border rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.346A3.001 3.001 0 0112 21a3 3 0 01-2.121-.879l-.347-.347z" />
              </svg>
              <h3 class="text-sm font-semibold text-ink dark:text-dark-text">AI 가격 분석</h3>
            </div>
            <button
              class="text-xs font-medium px-3 py-1 rounded-full bg-accent hover:bg-accent-hover text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              :disabled="aiLoading"
              @click="runAiAnalysis"
            >
              <svg v-if="aiLoading" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ aiLoading ? '분석 중...' : '분석 실행' }}
            </button>
          </div>

          <!-- 결과 -->
          <div v-if="aiResult" class="space-y-2">
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                :class="AI_LEVEL_COLOR[aiResult.resultLevel ?? 'SAFE']"
              >{{ AI_LEVEL_LABEL[aiResult.resultLevel ?? 'SAFE'] }}</span>
            </div>
            <p class="text-xs text-ink-muted dark:text-dark-muted leading-relaxed whitespace-pre-line">{{ aiResult.summary }}</p>
          </div>

          <!-- 미실행 상태 -->
          <p v-else-if="!aiLoading && !aiError" class="text-xs text-ink-faint dark:text-dark-muted">
            실거래가 데이터를 기반으로 이 매물의 가격 적정성을 분석합니다.
          </p>

          <!-- 에러 -->
          <p v-if="aiError" class="text-xs text-red-500 dark:text-red-400">{{ aiError }}</p>
        </div>
      </div>

    </template>
  </div>
</template>
