<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ChevronLeft, ChevronRight, Lightbulb, Loader2 } from 'lucide-vue-next'
import type { Listing, MarketProperty } from '@/types'
import type { AiAnalysis } from '@/types/ai'
import { listingsApi, marketApi, aiApi } from '@/api'
import { formatListingPrice, formatArea, formatFloor, formatManWon, DEAL_TYPE_LABEL } from '@/utils/format'
import NaverMap from '@/components/map/NaverMap.vue'
import { useAuthStore } from '@/stores'
import BaseButton from '@/components/ui/BaseButton.vue'
import BookmarkButton from '@/components/ui/BookmarkButton.vue'
import Badge from '@/components/ui/Badge.vue'
import type { BadgeTone } from '@/constants/dealTypeColors'

const props = defineProps<{
  listingId: number | null
}>()

const authStore = useAuthStore()
const router = useRouter()
const detail = ref<Listing | null>(null)
const aiResult = ref<AiAnalysis | null>(null)
const aiLoading = ref(false)
const aiError = ref('')

const AI_LEVEL_TONE: Record<string, BadgeTone> = {
  SAFE: 'green',
  CAUTION: 'amber',
  DANGER: 'rose',
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
const currentImageIndex = ref(0)
const dragStartX = ref<number | null>(null)

function prevImage() {
  const len = detail.value?.images?.length ?? 0
  if (!len) return
  currentImageIndex.value = (currentImageIndex.value - 1 + len) % len
}
function nextImage() {
  const len = detail.value?.images?.length ?? 0
  if (!len) return
  currentImageIndex.value = (currentImageIndex.value + 1) % len
}
function onImagePointerDown(e: PointerEvent) {
  dragStartX.value = e.clientX
}
function onImagePointerUp(e: PointerEvent) {
  if (dragStartX.value === null) return
  const delta = e.clientX - dragStartX.value
  dragStartX.value = null
  if (Math.abs(delta) <= 50) return
  delta > 0 ? prevImage() : nextImage()
}
const showReportModal = ref(false)
const reportReason = ref('')
const reportLoading = ref(false)

watch(
  () => props.listingId,
  async (id) => {
    if (!id) { detail.value = null; aiResult.value = null; return }
    loading.value = true
    aiResult.value = null
    aiError.value = ''
    currentImageIndex.value = 0
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

async function submitReport() {
  if (!detail.value || !reportReason.value.trim()) return
  reportLoading.value = true
  try {
    await listingsApi.report(detail.value.id, reportReason.value)
    showReportModal.value = false
    reportReason.value = ''
    alert('신고가 접수됐습니다.')
  } finally {
    reportLoading.value = false
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto scrollbar-hide bg-canvas-soft dark:bg-dark-base">

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

      <!-- 이미지 -->
      <div
        class="relative h-48 bg-canvas-soft dark:bg-dark-elevated"
        @pointerdown="onImagePointerDown"
        @pointerup="onImagePointerUp"
      >
        <template v-if="detail.images?.length">
          <img
            :src="detail.images[currentImageIndex].imageUrl"
            :alt="detail.title"
            class="w-full h-full object-cover cursor-grab active:cursor-grabbing"
            draggable="false"
          />
          <template v-if="detail.images.length > 1">
            <button
              type="button"
              aria-label="이전 사진"
              @click.stop="prevImage"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="다음 사진"
              @click.stop="nextImage"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <div class="absolute bottom-3 right-3 flex gap-1">
              <button
                v-for="(_, i) in detail.images"
                :key="i"
                @click.stop="currentImageIndex = i"
                class="w-2 h-2 rounded-full transition-colors cursor-pointer"
                :class="i === currentImageIndex ? 'bg-white' : 'bg-white/40'"
              />
            </div>
          </template>
        </template>
        <div v-else class="w-full h-full flex items-center justify-center text-ink-faint dark:text-dark-muted text-sm">
          이미지 없음
        </div>
      </div>

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
          <BookmarkButton :bookmarked="bookmarked" @click="toggleBookmark" />
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
          :key="detail.id"
          :latitude="detail.latitude"
          :longitude="detail.longitude"
          :address="detail.address"
          class="w-full h-96 rounded-xl overflow-hidden"
        />
      </div>

      <!-- 판매자 + 채팅 -->
      <div class="p-6">
        <h3 class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3">판매자</h3>
        <div class="flex items-center justify-between">
          <span class="text-sm text-ink-muted dark:text-dark-muted">{{ detail.sellerNickname }}</span>
          <div class="flex items-center gap-2">
            <RouterLink
              v-if="authStore.isAuthenticated"
              :to="`/chat?listingId=${detail.id}`"
              class="inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 cursor-pointer active:scale-95 text-sm px-4 py-1.5 bg-accent hover:bg-accent-hover text-white border-accent rounded-full shadow-sm"
            >채팅하기</RouterLink>
            <BaseButton
              v-else
              variant="secondary"
              @click="router.push({ path: '/login', query: { redirect: `/chat?listingId=${detail.id}` } })"
            >로그인 후 채팅</BaseButton>
            <button
              @click="showReportModal = true"
              class="py-1.5 px-4 border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted rounded-full text-sm hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            >신고</button>
          </div>
        </div>
      </div>

      <!-- AI 가격 분석 -->
      <div v-if="authStore.isAuthenticated" class="px-6 pb-6">
        <div class="border border-hairline dark:border-dark-border rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Lightbulb class="w-4 h-4 text-accent" />
              <h3 class="text-sm font-semibold text-ink dark:text-dark-text">AI 가격 분석</h3>
            </div>
            <BaseButton variant="primary" size="sm" :disabled="aiLoading" @click="runAiAnalysis">
              <Loader2 v-if="aiLoading" class="w-3 h-3 animate-spin" />
              {{ aiLoading ? '분석 중...' : '분석 실행' }}
            </BaseButton>
          </div>

          <!-- 결과 -->
          <div v-if="aiResult" class="space-y-2">
            <div class="flex items-center gap-2">
              <Badge :tone="AI_LEVEL_TONE[aiResult.resultLevel ?? 'SAFE']">{{ AI_LEVEL_LABEL[aiResult.resultLevel ?? 'SAFE'] }}</Badge>
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

    <!-- 신고 모달 -->
    <Teleport to="body">
      <div
        v-if="showReportModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
        @click.self="showReportModal = false"
      >
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-6 w-full max-w-sm">
          <h3 class="text-base font-semibold text-ink dark:text-dark-text mb-4 tracking-tight">매물 신고</h3>
          <textarea
            v-model="reportReason"
            placeholder="신고 사유를 입력해주세요"
            rows="4"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent resize-none"
          />
          <div class="flex gap-3 mt-4">
            <button
              @click="showReportModal = false"
              class="flex-1 py-2 border border-hairline dark:border-dark-border rounded-full text-sm text-ink-muted dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated cursor-pointer"
            >취소</button>
            <button
              @click="submitReport"
              :disabled="reportLoading || !reportReason.trim()"
              class="flex-1 py-2 bg-accent hover:bg-accent-hover text-white rounded-full text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >신고하기</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
