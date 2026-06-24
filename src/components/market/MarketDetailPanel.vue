<script setup lang="ts">
import { ref, watch } from 'vue'
import { animate } from 'animejs'
import { marketApi } from '@/api'
import { useAuthStore } from '@/stores'
import { useRouter } from 'vue-router'
import { Share2, Check } from 'lucide-vue-next'
import type { MarketProperty } from '@/types'
import { formatManWon, formatArea, formatFloor } from '@/utils/format'
import NaverMap from '@/components/map/NaverMap.vue'
import Badge from '@/components/ui/Badge.vue'
import BookmarkButton from '@/components/ui/BookmarkButton.vue'
import { DEAL_TYPE_TONE, PROPERTY_TYPE_TONE } from '@/constants/dealTypeColors'
import { useAsyncAction } from '@/composables/useAsyncAction'

const props = defineProps<{ propertyId: number | null }>()

const router = useRouter()
const authStore = useAuthStore()

const property = ref<MarketProperty | null>(null)
const { loading, run } = useAsyncAction()
const bookmarked = ref(false)
const bookmarkLoading = ref(false)
const shareCopied = ref(false)

async function shareProperty() {
  if (!property.value) return
  const url = `${window.location.origin}/market/${property.value.id}`
  if (navigator.share) {
    try {
      await navigator.share({ title: property.value.propertyName, url })
    } catch {}
    return
  }
  await navigator.clipboard.writeText(url)
  shareCopied.value = true
  setTimeout(() => (shareCopied.value = false), 1500)
}

const DEAL_LABEL: Record<string, string> = {
  SALE: '매매',
  JEONSE: '전세',
  MONTHLY_RENT: '월세',
}
const PROPERTY_LABEL: Record<string, string> = {
  MULTI_FAMILY: '연립다세대',
  OFFICETEL: '오피스텔',
}

function formatPrice(p: MarketProperty): string {
  if (p.dealType === 'MONTHLY_RENT')
    return `${formatManWon(p.dealAmount)} / 월 ${p.monthlyRent?.toLocaleString() ?? '-'}만`
  return formatManWon(p.dealAmount)
}

function formatDealDate(p: MarketProperty): string {
  return `${p.dealYear}.${String(p.dealMonth).padStart(2, '0')}.${String(p.dealDay).padStart(2, '0')}`
}

async function fetchDetail(id: number) {
  property.value = null
  await run(async () => {
    const res = await marketApi.getById(id)
    property.value = res.data.data
    bookmarked.value = res.data.data.bookmarked ?? false
  })
}

async function toggleBookmark() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (!property.value) return
  bookmarkLoading.value = true
  try {
    if (bookmarked.value) {
      await marketApi.unbookmark(property.value.id)
      bookmarked.value = false
    } else {
      await marketApi.bookmark(property.value.id)
      bookmarked.value = true
    }
  } finally {
    bookmarkLoading.value = false
  }
}

function onDetailEnter(el: Element, done: () => void) {
  animate(el, {
    translateY: [8, 0],
    opacity: [0, 1],
    duration: 250,
    ease: 'outCubic',
    onComplete: done,
  })
}

watch(
  () => props.propertyId,
  (id) => {
    if (id != null) fetchDetail(id)
    else property.value = null
  },
  { immediate: true },
)

const parsedAddress = (fullAddress: string | null | undefined) => {
  if (!fullAddress) return "";
  
  // 정규식 매칭을 통해 하위 주소 추출
  const match = fullAddress.match(/([가-힣0-9]+(동|리|가|로|길)\s+.*)/);
  
  // 매칭 성공 시 파싱된 하위 주소 반환, 실패 시 원본 반환하여 API의 자체 Fallback 유도
  return match ? match[0] : fullAddress;
};
</script>

<template>
  <div
    class="h-full flex flex-col overflow-y-auto scrollbar-hide bg-canvas-soft dark:bg-dark-base"
  >
    <!-- 선택 전 플레이스홀더 -->
    <div
      v-if="propertyId == null"
      class="flex-1 flex flex-col items-center justify-center gap-2 text-ink-faint dark:text-dark-muted"
    >
      <p class="text-sm font-medium text-ink dark:text-dark-text">
        실거래가를 선택하세요
      </p>
      <p class="text-xs">
        왼쪽 목록에서 항목을 클릭하면 상세 정보가 표시됩니다
      </p>
    </div>

    <!-- 로딩 -->
    <div v-else-if="loading" class="flex-1 flex items-center justify-center">
      <div
        class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"
      />
    </div>

    <!-- 상세 정보 -->
    <Transition v-else :css="false" @enter="onDetailEnter">
      <div v-if="property" :key="property.id" class="p-6 space-y-3">
        <!-- 헤더 -->
        <div
          class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2 flex-wrap">
                <Badge :tone="DEAL_TYPE_TONE[property.dealType]">{{
                  DEAL_LABEL[property.dealType]
                }}</Badge>
                <Badge :tone="PROPERTY_TYPE_TONE[property.propertyType]">{{
                  PROPERTY_LABEL[property.propertyType]
                }}</Badge>
              </div>
              <h2
                class="text-lg font-bold text-ink dark:text-dark-text tracking-tight"
              >
                {{ property.propertyName }}
              </h2>
              <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">
                {{ property.districtName }}
              </p>
              <p class="text-2xl font-bold text-accent mt-2">
                {{ formatPrice(property) }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="링크 공유"
                class="relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:border-accent hover:text-accent hover:bg-accent-light dark:hover:bg-accent-dark-muted transition-colors duration-150 cursor-pointer active:scale-95"
                @click="shareProperty"
              >
                <Check v-if="shareCopied" class="w-4 h-4 text-accent" />
                <Share2 v-else class="w-4 h-4" />
                <span
                  v-if="shareCopied"
                  class="absolute -bottom-7 right-0 text-xs whitespace-nowrap bg-ink dark:bg-dark-elevated text-white dark:text-dark-text px-2 py-1 rounded shadow-sm"
                  >링크 복사됨</span
                >
              </button>
              <BookmarkButton
                :bookmarked="bookmarked"
                :disabled="bookmarkLoading"
                @click="toggleBookmark"
              />
            </div>
          </div>
        </div>

        <!-- 세부 정보 -->
        <div
          class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5"
        >
          <h3
            class="text-xs font-semibold text-ink-muted dark:text-dark-muted mb-3 uppercase tracking-wide"
          >
            거래 정보
          </h3>
          <div class="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-0.5">
                거래일
              </p>
              <p class="font-semibold text-ink dark:text-dark-text">
                {{ formatDealDate(property) }}
              </p>
            </div>
            <div>
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-0.5">
                면적
              </p>
              <p class="font-semibold text-ink dark:text-dark-text">
                {{ formatArea(property.area) }}
              </p>
            </div>
            <div>
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-0.5">
                층수
              </p>
              <p class="font-semibold text-ink dark:text-dark-text">
                {{ formatFloor(property.floor) }}
              </p>
            </div>
            <div>
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-0.5">
                건축연도
              </p>
              <p class="font-semibold text-ink dark:text-dark-text">
                {{ property.buildYear ? `${property.buildYear}년` : '-' }}
              </p>
            </div>
            <div>
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-0.5">
                법정동 코드
              </p>
              <p class="font-semibold text-ink dark:text-dark-text">
                {{ property.districtCode }}
              </p>
            </div>
          </div>
        </div>

        <!-- 위치 (법정동 기준 근사치) -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5">
          <h3 class="text-xs font-semibold text-ink-muted dark:text-dark-muted mb-3 uppercase tracking-wide">위치</h3>
          <NaverMap
            :key="property.id"
            :address="parsedAddress(property.districtName)"
            class="w-full h-96 rounded-lg overflow-hidden"
          />
          <p class="text-xs text-ink-faint dark:text-dark-muted mt-2">* 법정동 기준 근사 위치입니다 (정확한 지번 정보 없음)</p>
        </div>

        <!-- 출처 안내 -->
        <div
          class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4"
        >
          <p class="text-xs text-ink-faint dark:text-dark-muted">
            * 본 데이터는 국토교통부 실거래가 공공데이터 기반입니다.
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>
