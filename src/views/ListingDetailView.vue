<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listingsApi } from '@/api'
import { useAuthStore } from '@/stores'
import type { Listing } from '@/types'
import { formatListingPrice, formatArea, formatFloor, DEAL_TYPE_LABEL, STATUS_LABEL, STATUS_COLOR } from '@/utils/format'
import AppHeader from '@/components/layout/AppHeader.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const listing = ref<Listing | null>(null)
const loading = ref(true)
const error = ref(false)
const bookmarked = ref(false)
const bookmarkLoading = ref(false)
const currentImageIndex = ref(0)
const showReportModal = ref(false)
const reportReason = ref('')
const reportLoading = ref(false)
const deleteLoading = ref(false)

const id = Number(route.params.id)
const isOwner = () => listing.value && authStore.user && listing.value.sellerId === authStore.user.id

async function fetchListing() {
  loading.value = true
  error.value = false
  try {
    const res = await listingsApi.getById(id)
    listing.value = res.data.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function toggleBookmark() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  bookmarkLoading.value = true
  try {
    if (bookmarked.value) {
      await listingsApi.unbookmark(id)
      bookmarked.value = false
    } else {
      await listingsApi.bookmark(id)
      bookmarked.value = true
    }
  } finally {
    bookmarkLoading.value = false
  }
}

async function deleteListing() {
  if (!confirm('매물을 삭제하시겠습니까?')) return
  deleteLoading.value = true
  try {
    await listingsApi.delete(id)
    router.push('/my/listings')
  } finally {
    deleteLoading.value = false
  }
}

async function submitReport() {
  if (!reportReason.value.trim()) return
  reportLoading.value = true
  try {
    await listingsApi.report(id, reportReason.value)
    showReportModal.value = false
    reportReason.value = ''
    alert('신고가 접수됐습니다.')
  } finally {
    reportLoading.value = false
  }
}

onMounted(fetchListing)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />

    <main class="flex-1 max-w-3xl mx-auto w-full px-4 pt-14 pb-8">
      <!-- 로딩 -->
      <div v-if="loading" class="flex justify-center items-center py-32">
        <div class="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- 에러 -->
      <div v-else-if="error" class="text-center py-32 text-ink-muted dark:text-dark-muted">
        <p class="text-sm mb-3">매물을 불러올 수 없습니다.</p>
        <button @click="fetchListing" class="text-accent hover:underline text-sm cursor-pointer">다시 시도</button>
      </div>

      <!-- 매물 상세 -->
      <div v-else-if="listing" class="py-6">

        <!-- 이미지 갤러리 -->
        <div class="relative rounded-xl overflow-hidden bg-canvas-soft dark:bg-dark-elevated mb-5 aspect-video">
          <template v-if="listing.images.length > 0">
            <img
              :src="listing.images[currentImageIndex].imageUrl"
              :alt="listing.title"
              class="w-full h-full object-cover"
            />
            <div v-if="listing.images.length > 1" class="absolute bottom-3 right-3 flex gap-1">
              <button
                v-for="(_, i) in listing.images"
                :key="i"
                @click="currentImageIndex = i"
                class="w-2 h-2 rounded-full transition-colors cursor-pointer"
                :class="i === currentImageIndex ? 'bg-white' : 'bg-white/40'"
              />
            </div>
            <button
              v-if="listing.images.length > 1 && currentImageIndex > 0"
              @click="currentImageIndex--"
              class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
            >‹</button>
            <button
              v-if="listing.images.length > 1 && currentImageIndex < listing.images.length - 1"
              @click="currentImageIndex++"
              class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
            >›</button>
          </template>
          <div v-else class="w-full h-full flex items-center justify-center text-ink-faint dark:text-dark-muted text-sm">
            이미지 없음
          </div>
        </div>

        <!-- 헤더 정보 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5 mb-3">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                  {{ DEAL_TYPE_LABEL[listing.dealType] }}
                </span>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="STATUS_COLOR[listing.status]">
                  {{ STATUS_LABEL[listing.status] }}
                </span>
              </div>
              <h1 class="text-lg font-bold text-ink dark:text-dark-text tracking-tight truncate">{{ listing.title }}</h1>
              <p class="text-2xl font-bold text-accent mt-1">{{ formatListingPrice(listing) }}</p>
            </div>
            <button
              @click="toggleBookmark"
              :disabled="bookmarkLoading"
              class="flex-shrink-0 w-9 h-9 rounded-full border border-hairline dark:border-dark-border flex items-center justify-center transition-colors hover:bg-canvas-soft dark:hover:bg-dark-elevated cursor-pointer"
            >
              <span class="text-base" :class="bookmarked ? 'text-red-500' : 'text-ink-faint'">
                {{ bookmarked ? '♥' : '♡' }}
              </span>
            </button>
          </div>

          <!-- 기본 정보 -->
          <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div class="text-center p-3 bg-canvas-soft dark:bg-dark-elevated rounded-lg">
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-1">면적</p>
              <p class="font-semibold text-ink dark:text-dark-text">{{ formatArea(listing.area) }}</p>
            </div>
            <div class="text-center p-3 bg-canvas-soft dark:bg-dark-elevated rounded-lg">
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-1">층수</p>
              <p class="font-semibold text-ink dark:text-dark-text">{{ formatFloor(listing.floor) }}</p>
            </div>
            <div class="text-center p-3 bg-canvas-soft dark:bg-dark-elevated rounded-lg">
              <p class="text-ink-faint dark:text-dark-muted text-xs mb-1">조회수</p>
              <p class="font-semibold text-ink dark:text-dark-text">{{ listing.viewCount }}</p>
            </div>
          </div>
        </div>

        <!-- 주소 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5 mb-3">
          <h2 class="text-xs font-semibold text-ink-muted dark:text-dark-muted mb-2 uppercase tracking-wide">위치</h2>
          <p class="text-sm text-ink dark:text-dark-text">{{ listing.address }}</p>
          <p v-if="listing.addressDetail" class="text-xs text-ink-faint dark:text-dark-muted mt-1">{{ listing.addressDetail }}</p>
        </div>

        <!-- 설명 -->
        <div v-if="listing.description" class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5 mb-3">
          <h2 class="text-xs font-semibold text-ink-muted dark:text-dark-muted mb-2 uppercase tracking-wide">매물 설명</h2>
          <p class="text-sm text-ink-secondary dark:text-dark-text whitespace-pre-line leading-relaxed">{{ listing.description }}</p>
        </div>

        <!-- 액션 버튼 -->
        <div class="flex gap-3 mt-4">
          <template v-if="isOwner()">
            <RouterLink
              :to="`/listings/${listing.id}/edit`"
              class="flex-1 py-2.5 border border-accent text-accent rounded-full text-center text-sm font-semibold hover:bg-accent/5 transition-colors"
            >수정하기</RouterLink>
            <button
              @click="deleteListing"
              :disabled="deleteLoading"
              class="flex-1 py-2.5 border border-red-400 text-red-500 rounded-full text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 cursor-pointer"
            >삭제하기</button>
          </template>
          <template v-else>
            <RouterLink
              to="/chat"
              class="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-full text-center text-sm font-semibold transition-colors"
            >채팅 문의</RouterLink>
            <button
              @click="showReportModal = true"
              class="py-2.5 px-4 border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted rounded-full text-sm hover:bg-canvas dark:hover:bg-dark-elevated transition-colors cursor-pointer"
            >신고</button>
          </template>
        </div>

        <p class="text-xs text-ink-faint dark:text-dark-muted text-center mt-4">
          등록일 {{ new Date(listing.createdAt).toLocaleDateString('ko-KR') }}
        </p>
      </div>
    </main>

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
