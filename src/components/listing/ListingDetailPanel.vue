<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { animate } from 'animejs'
import { useRouter, RouterLink } from 'vue-router'
import {
  ChevronLeft,
  ChevronRight,
  UserRound,
  Share2,
  Check,
} from 'lucide-vue-next'
import type { Listing, MarketProperty, PublicProfile } from '@/types'
import { listingsApi, authApi } from '@/api'
import {
  formatListingPrice,
  formatArea,
  formatFloor,
  formatManWon,
  DEAL_TYPE_LABEL,
  STATUS_LABEL,
} from '@/utils/format'
import NaverMap from '@/components/map/NaverMap.vue'
import { useAuthStore } from '@/stores'
import BaseButton from '@/components/ui/BaseButton.vue'
import BookmarkButton from '@/components/ui/BookmarkButton.vue'
import Badge from '@/components/ui/Badge.vue'
import { DEAL_TYPE_TONE, STATUS_TONE } from '@/constants/dealTypeColors'
import { useAsyncAction } from '@/composables/useAsyncAction'
import ListingImageCarousel from './detail/ListingImageCarousel.vue'
import ListingAiAnalysisCard from './detail/ListingAiAnalysisCard.vue'
import ListingReportModal from './detail/ListingReportModal.vue'

const props = defineProps<{
  listingId: number | null
}>()

const authStore = useAuthStore()
const router = useRouter()
const detail = ref<Listing | null>(null)
const sellerProfile = ref<PublicProfile | null>(null)

const nearbyMarket = ref<MarketProperty[]>([])
const nearbyMarketPage = ref(0)
const NEARBY_MARKET_PAGE_SIZE = 10
const nearbyMarketTotalPages = computed(() =>
  Math.ceil(nearbyMarket.value.length / NEARBY_MARKET_PAGE_SIZE),
)
const nearbyMarketPaged = computed(() => {
  const start = nearbyMarketPage.value * NEARBY_MARKET_PAGE_SIZE
  return nearbyMarket.value.slice(start, start + NEARBY_MARKET_PAGE_SIZE)
})
const { loading, run } = useAsyncAction()
const bookmarked = ref(false)
const addressResolved = ref(true)
const showReportModal = ref(false)
const deleteLoading = ref(false)
const scrollEl = ref<HTMLElement | null>(null)
const shareCopied = ref(false)

const isOwner = () =>
  !!detail.value &&
  !!authStore.user &&
  detail.value.sellerId === authStore.user.id

watch(
  () => props.listingId,
  async (id) => {
    scrollEl.value?.scrollTo({ top: 0 })
    if (!id) {
      detail.value = null
      sellerProfile.value = null
      return
    }
    detail.value = null
    sellerProfile.value = null
    await run(async () => {
      const res = await listingsApi.getById(id)
      detail.value = res.data.data
      bookmarked.value = res.data.data.bookmarked ?? false
      addressResolved.value = true
      nearbyMarket.value = res.data.data.nearbyMarketPrices ?? []
      nearbyMarketPage.value = 0
      if (!detail.value.sellerNickname) {
        authApi
          .getPublicProfile(detail.value.sellerId)
          .then((r) => {
            sellerProfile.value = r.data.data
          })
          .catch(() => {})
      }
    }).catch(() => {
      detail.value = null
    })
  },
  { immediate: true },
)

async function shareListing() {
  if (!detail.value) return
  const url = `${window.location.origin}/listings/${detail.value.id}`
  if (navigator.share) {
    try {
      await navigator.share({ title: detail.value.title, url })
    } catch {}
    return
  }
  await navigator.clipboard.writeText(url)
  shareCopied.value = true
  setTimeout(() => (shareCopied.value = false), 1500)
}

async function toggleBookmark() {
  if (!detail.value || !authStore.isAuthenticated) return
  try {
    if (bookmarked.value) {
      await listingsApi.unbookmark(detail.value.id)
      detail.value.bookmarkCount--
    } else {
      await listingsApi.bookmark(detail.value.id)
      detail.value.bookmarkCount++
    }
    bookmarked.value = !bookmarked.value
  } catch {}
}

async function deleteListing() {
  if (!detail.value || !confirm('매물을 삭제하시겠습니까?')) return
  deleteLoading.value = true
  try {
    await listingsApi.delete(detail.value.id)
    router.push('/my/listings')
  } finally {
    deleteLoading.value = false
  }
}

function onDetailEnter(el: Element, done: () => void) {
  animate(el, {
    opacity: [0, 1],
    duration: 200,
    ease: 'outCubic',
    onComplete: done,
  })
}
</script>

<template>
  <div
    ref="scrollEl"
    class="h-full overflow-y-auto scrollbar-hide bg-canvas dark:bg-dark-surface"
  >
    <!-- 미선택 -->
    <div
      v-if="!listingId"
      class="flex items-center justify-center h-full text-ink-faint dark:text-dark-muted"
    >
      <div class="text-center space-y-2">
        <p class="text-lg font-semibold text-ink dark:text-dark-text">
          매물을 선택하세요
        </p>
        <p class="text-sm">
          왼쪽 목록에서 매물을 클릭하면 상세 정보가 표시됩니다
        </p>
      </div>
    </div>

    <!-- 로딩 -->
    <div
      v-else-if="loading"
      class="flex flex-col items-center justify-center h-full gap-3 text-ink-faint dark:text-dark-muted"
    >
      <div
        class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"
      />
      <p class="text-sm">불러오는 중...</p>
    </div>

    <Transition :css="false" @enter="onDetailEnter">
      <div v-if="detail" :key="detail.id" class="max-w-2xl mx-auto">
        <!-- 이미지 -->
        <ListingImageCarousel :images="detail.images" :title="detail.title" />

        <!-- 헤더 -->
        <div
          class="p-6 border-b border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <Badge :tone="DEAL_TYPE_TONE[detail.dealType]">{{
                  DEAL_TYPE_LABEL[detail.dealType]
                }}</Badge>
                <Badge
                  v-if="STATUS_LABEL[detail.status]"
                  :tone="STATUS_TONE[detail.status]"
                  >{{ STATUS_LABEL[detail.status] }}</Badge
                >
              </div>
              <p
                class="text-xs text-ink-faint dark:text-dark-muted mb-1 truncate"
              >
                {{ detail.address }}
              </p>
              <h2
                class="text-lg font-bold text-ink dark:text-dark-text tracking-tight"
              >
                {{ detail.title }}
              </h2>
              <p class="text-2xl font-bold text-accent mt-1.5">
                {{ formatListingPrice(detail) }}
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="링크 공유"
                class="relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:border-accent hover:text-accent hover:bg-accent-light dark:hover:bg-accent-dark-muted transition-colors duration-150 cursor-pointer active:scale-95"
                @click="shareListing"
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
                @click="toggleBookmark"
              />
              <span class="text-xs text-ink-faint dark:text-dark-muted">{{
                detail.bookmarkCount
              }}</span>
            </div>
          </div>
        </div>

        <!-- 기본 정보 -->
        <div class="p-6 border-b border-hairline dark:border-dark-border">
          <h3
            class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3"
          >
            기본 정보
          </h3>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div
              v-for="(info, i) in [
                { label: '면적', value: formatArea(detail.area) },
                { label: '층수', value: formatFloor(detail.floor) },
                {
                  label: '조회수',
                  value: Number(detail.viewCount).toLocaleString(),
                },
                {
                  label: '등록일',
                  value: new Date(detail.createdAt).toLocaleDateString('ko-KR'),
                },
              ]"
              :key="i"
              class="bg-canvas-soft dark:bg-dark-elevated rounded-lg p-3"
            >
              <p class="text-xs text-ink-faint dark:text-dark-muted mb-1">
                {{ info.label }}
              </p>
              <p class="text-sm font-semibold text-ink dark:text-dark-text">
                {{ info.value }}
              </p>
            </div>
          </div>
        </div>

        <!-- 설명 -->
        <div
          v-if="detail.description"
          class="p-6 border-b border-hairline dark:border-dark-border"
        >
          <h3
            class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3"
          >
            매물 설명
          </h3>
          <p
            class="text-sm text-ink-muted dark:text-dark-muted whitespace-pre-wrap leading-relaxed"
          >
            {{ detail.description }}
          </p>
        </div>

        <!-- 실거래가 비교 -->
        <div class="p-6 border-b border-hairline dark:border-dark-border">
          <h3
            class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3"
          >
            인근 실거래가 비교
          </h3>
          <p
            v-if="nearbyMarket.length === 0"
            class="text-sm text-ink-faint dark:text-dark-muted py-4 text-center"
          >
            주변 최근 실거래가가 없습니다
          </p>
          <div v-else>
            <div class="max-h-[220px] overflow-y-auto scrollbar-hide">
              <table class="w-full text-sm">
                <thead>
                  <tr
                    class="text-ink-faint dark:text-dark-muted border-b border-hairline dark:border-dark-border"
                  >
                    <th class="pb-2 text-left font-medium">거래일</th>
                    <th class="pb-2 text-left font-medium">유형</th>
                    <th class="pb-2 text-right font-medium">가격</th>
                    <th class="pb-2 text-right font-medium">면적</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in nearbyMarketPaged"
                    :key="item.id"
                    class="border-b border-hairline dark:border-dark-border/40 hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
                  >
                    <td class="py-2 text-ink-muted dark:text-dark-muted">
                      {{ item.dealYear }}.{{ item.dealMonth }}.{{
                        item.dealDay
                      }}
                    </td>
                    <td class="py-2 text-ink-muted dark:text-dark-muted">
                      {{ DEAL_TYPE_LABEL[item.dealType] }}
                    </td>
                    <td
                      class="py-2 text-right font-semibold text-ink dark:text-dark-text"
                    >
                      {{ formatManWon(item.dealAmount) }}
                    </td>
                    <td
                      class="py-2 text-right text-ink-muted dark:text-dark-muted"
                    >
                      {{ formatArea(item.area) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div
              v-if="nearbyMarketTotalPages > 1"
              class="flex items-center justify-between mt-2 text-xs text-ink-faint dark:text-dark-muted"
            >
              <button
                type="button"
                :disabled="nearbyMarketPage === 0"
                class="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                @click="nearbyMarketPage--"
              >
                <ChevronLeft class="w-3.5 h-3.5" />
                이전
              </button>
              <span
                >{{ nearbyMarketPage + 1 }} / {{ nearbyMarketTotalPages }}</span
              >
              <button
                type="button"
                :disabled="nearbyMarketPage >= nearbyMarketTotalPages - 1"
                class="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-canvas-soft dark:hover:bg-dark-elevated disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                @click="nearbyMarketPage++"
              >
                다음
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 지도 -->
        <div class="p-6 border-b border-hairline dark:border-dark-border">
          <h3
            class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3"
          >
            위치
          </h3>
          <p
            v-if="addressResolved"
            class="text-sm text-ink dark:text-dark-text"
          >
            {{ detail.address }}
          </p>
          <p v-else class="text-sm text-ink-faint dark:text-dark-muted">
            주소 정보 없음
          </p>
          <p
            v-if="detail.addressDetail && addressResolved"
            class="text-xs text-ink-faint dark:text-dark-muted mt-1"
          >
            {{ detail.addressDetail }}
          </p>
          <NaverMap
            :key="detail.id"
            :latitude="detail.latitude"
            :longitude="detail.longitude"
            :address="detail.address"
            class="mt-3 w-full h-96 rounded-xl overflow-hidden"
            @geocode-result="
              (found) =>
                (addressResolved =
                  found || !!(detail?.latitude && detail?.longitude))
            "
          />
        </div>

        <!-- 판매자 + 채팅 -->
        <div class="p-6">
          <h3
            class="text-sm font-semibold text-ink-secondary dark:text-dark-text mb-3"
          >
            판매자
          </h3>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-white border border-hairline dark:border-dark-border flex items-center justify-center"
              >
                <img
                  v-if="sellerProfile?.profileImageUrl"
                  :src="sellerProfile.profileImageUrl"
                  loading="lazy"
                  decoding="async"
                  class="w-full h-full object-cover"
                />
                <UserRound v-else class="w-4 h-4 text-ink-faint" />
              </div>
              <span class="text-sm text-ink-muted dark:text-dark-muted">
                {{
                  detail.sellerNickname ??
                  sellerProfile?.nickname ??
                  `판매자 #${detail.sellerId}`
                }}
              </span>
            </div>
            <div v-if="isOwner()" class="flex items-center gap-2">
              <RouterLink
                :to="`/listings/${detail.id}/edit`"
                class="inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 cursor-pointer active:scale-95 text-sm px-4 py-1.5 border border-accent text-accent rounded-full hover:bg-accent-light dark:hover:bg-accent-dark-muted"
                >수정하기</RouterLink
              >
              <button
                @click="deleteListing"
                :disabled="deleteLoading"
                class="inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 cursor-pointer active:scale-95 disabled:opacity-50 text-sm px-4 py-1.5 border border-red-400 text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                삭제하기
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <RouterLink
                v-if="authStore.isAuthenticated"
                :to="`/chat?listingId=${detail.id}`"
                class="inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 cursor-pointer active:scale-95 text-sm px-4 py-1.5 bg-accent hover:bg-accent-hover text-white border-accent rounded-full shadow-sm"
                >채팅하기</RouterLink
              >
              <BaseButton
                v-else
                variant="secondary"
                @click="
                  router.push({
                    path: '/login',
                    query: { redirect: `/chat?listingId=${detail.id}` },
                  })
                "
                >로그인 후 채팅</BaseButton
              >
              <button
                @click="showReportModal = true"
                class="py-1.5 px-4 border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted rounded-full text-sm hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer"
              >
                신고
              </button>
            </div>
          </div>
        </div>

        <!-- AI 가격 분석 -->
        <div v-if="authStore.isAuthenticated" class="px-6 pb-6">
          <ListingAiAnalysisCard :listing-id="detail.id" />
        </div>
      </div>
    </Transition>

    <!-- 신고 모달 -->
    <ListingReportModal
      v-if="detail"
      v-model:open="showReportModal"
      :listing-id="detail.id"
    />
  </div>
</template>
