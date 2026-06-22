<script setup lang="ts">
import { ref, watch } from 'vue'
import { marketApi } from '@/api'
import { useAuthStore } from '@/stores'
import { useRouter } from 'vue-router'
import type { MarketProperty } from '@/types'
import { formatManWon, formatArea, formatFloor } from '@/utils/format'
import NaverMap from '@/components/map/NaverMap.vue'
import Badge from '@/components/ui/Badge.vue'
import BookmarkButton from '@/components/ui/BookmarkButton.vue'
import { DEAL_TYPE_TONE, PROPERTY_TYPE_TONE } from '@/constants/dealTypeColors'

const props = defineProps<{ propertyId: number | null }>()

const router = useRouter()
const authStore = useAuthStore()

const property = ref<MarketProperty | null>(null)
const loading = ref(false)
const bookmarked = ref(false)
const bookmarkLoading = ref(false)

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
  loading.value = true
  property.value = null
  try {
    const res = await marketApi.getById(id)
    property.value = res.data.data
  } finally {
    loading.value = false
  }
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

watch(
  () => props.propertyId,
  (id) => {
    if (id != null) fetchDetail(id)
    else property.value = null
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="h-full flex flex-col overflow-y-auto bg-canvas-soft dark:bg-dark-base"
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
    <template v-else-if="property">
      <div class="p-6 space-y-3">
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
            <BookmarkButton
              :bookmarked="bookmarked"
              :disabled="bookmarkLoading"
              @click="toggleBookmark"
            />
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
        <div
          class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5"
        >
          <h3
            class="text-xs font-semibold text-ink-muted dark:text-dark-muted mb-3 uppercase tracking-wide"
          >
            위치
          </h3>
          <NaverMap
            :key="property.id"
            :address="property.address"
            class="w-full h-96 rounded-lg overflow-hidden"
          />
          <p class="text-xs text-ink-faint dark:text-dark-muted mt-2">
            * 법정동 기준 근사 위치입니다 (정확한 지번 정보 없음)
          </p>
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
    </template>
  </div>
</template>
