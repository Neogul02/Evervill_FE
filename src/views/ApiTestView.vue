<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import NaverMap from '@/components/map/NaverMap.vue'
import { authApi, listingsApi, marketApi, chatApi, aiApi } from '@/api'

const activeTab = ref<'map' | 'auth' | 'listings' | 'market' | 'chat' | 'ai'>('map')

// ── Naver Map ──────────────────────────────────────────────
const mapLat = ref(37.5665)
const mapLng = ref(126.9780)
const mapAppliedLat = ref(37.5665)
const mapAppliedLng = ref(126.9780)
const naverSdkStatus = ref<'checking' | 'loaded' | 'not loaded'>('checking')

onMounted(() => {
  if (window.naver?.maps) {
    naverSdkStatus.value = 'loaded'
    return
  }
  const timer = setInterval(() => {
    if (window.naver?.maps) {
      clearInterval(timer)
      naverSdkStatus.value = 'loaded'
    }
  }, 100)
  setTimeout(() => {
    clearInterval(timer)
    if (naverSdkStatus.value === 'checking') naverSdkStatus.value = 'not loaded'
  }, 10000)
})

function applyMapCoords() {
  mapAppliedLat.value = mapLat.value
  mapAppliedLng.value = mapLng.value
}

// ── API Test Helper ────────────────────────────────────────
interface TestResult {
  status?: number
  data?: any
  error?: any
  loading: boolean
}

const results = reactive<Record<string, TestResult>>({})

async function run(key: string, fn: () => Promise<any>) {
  results[key] = { loading: true }
  try {
    const res = await fn()
    results[key] = { status: res.status, data: res.data, loading: false }
  } catch (e: any) {
    results[key] = {
      status: e.response?.status,
      error: e.response?.data ?? e.message,
      loading: false,
    }
  }
}

// ── Auth inputs ────────────────────────────────────────────
const loginForm = reactive({ email: 'test@test.com', password: 'test1234' })
const registerForm = reactive({ email: '', password: '', nickname: '' })

// ── Listings inputs ────────────────────────────────────────
const listingFilter = reactive({ dealType: '', page: 0, size: 5 })
const listingId = ref(1)

// ── Market inputs ──────────────────────────────────────────
const marketFilter = reactive({ districtCode: '', dealType: '', page: 0, size: 5 })
const marketId = ref(1)

// ── Chat inputs ────────────────────────────────────────────
const chatListingId = ref(1)

// ── AI inputs ─────────────────────────────────────────────
const aiTargetId = ref(1)

const TABS = [
  { key: 'map', label: '🗺 네이버 지도' },
  { key: 'auth', label: '🔐 인증' },
  { key: 'listings', label: '🏠 매물' },
  { key: 'market', label: '📊 실거래가' },
  { key: 'chat', label: '💬 채팅' },
  { key: 'ai', label: '🤖 AI 분석' },
] as const
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 class="font-bold text-gray-800 text-lg">API Test Page</h1>
      <a href="/" class="text-sm text-blue-600 hover:underline">← 홈으로</a>
    </div>

    <!-- Tabs -->
    <div class="sticky top-12 z-10 bg-white border-b border-gray-200 px-6 flex gap-1">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
        :class="activeTab === tab.key
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-800'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="p-6 max-w-4xl mx-auto space-y-4">

      <!-- ── 네이버 지도 ─────────────────────────────── -->
      <template v-if="activeTab === 'map'">
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-800">Naver Maps SDK</h2>
            <span
              class="text-xs px-2.5 py-1 rounded-full font-medium"
              :class="{
                'bg-green-100 text-green-700': naverSdkStatus === 'loaded',
                'bg-red-100 text-red-700': naverSdkStatus === 'not loaded',
                'bg-yellow-100 text-yellow-700': naverSdkStatus === 'checking',
              }"
            >
              {{ naverSdkStatus === 'loaded' ? '✓ SDK 로드됨' : naverSdkStatus === 'not loaded' ? '✗ SDK 없음' : '⏳ 확인 중...' }}
            </span>
          </div>

          <div class="flex gap-3 items-end">
            <div>
              <label class="text-xs text-gray-500 block mb-1">위도</label>
              <input v-model.number="mapLat" type="number" step="0.0001"
                class="w-36 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">경도</label>
              <input v-model.number="mapLng" type="number" step="0.0001"
                class="w-36 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <button @click="applyMapCoords"
              class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              이동
            </button>
            <button @click="() => { mapLat = 37.5665; mapLng = 126.9780; applyMapCoords() }"
              class="px-4 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              서울 중심
            </button>
          </div>

          <NaverMap
            :latitude="mapAppliedLat"
            :longitude="mapAppliedLng"
            :zoom="15"
            class="w-full rounded-lg overflow-hidden"
            style="height: 400px"
          />
        </div>
      </template>

      <!-- ── 인증 ───────────────────────────────────── -->
      <template v-if="activeTab === 'auth'">
        <!-- Login -->
        <TestCard method="POST" endpoint="/auth/login">
          <div class="flex gap-2 flex-wrap">
            <input v-model="loginForm.email" placeholder="이메일"
              class="input-sm w-48" />
            <input v-model="loginForm.password" type="password" placeholder="비밀번호"
              class="input-sm w-36" />
            <RunBtn :loading="results['login']?.loading" @click="run('login', () => authApi.login(loginForm))" />
          </div>
          <ResponseBox :result="results['login']" />
        </TestCard>

        <!-- Register -->
        <TestCard method="POST" endpoint="/auth/register">
          <div class="flex gap-2 flex-wrap">
            <input v-model="registerForm.email" placeholder="이메일" class="input-sm w-44" />
            <input v-model="registerForm.password" type="password" placeholder="비밀번호" class="input-sm w-32" />
            <input v-model="registerForm.nickname" placeholder="닉네임" class="input-sm w-28" />
            <RunBtn :loading="results['register']?.loading" @click="run('register', () => authApi.register(registerForm))" />
          </div>
          <ResponseBox :result="results['register']" />
        </TestCard>
      </template>

      <!-- ── 매물 ───────────────────────────────────── -->
      <template v-if="activeTab === 'listings'">
        <!-- Get List -->
        <TestCard method="GET" endpoint="/api/listings">
          <div class="flex gap-2 flex-wrap">
            <select v-model="listingFilter.dealType" class="input-sm w-28">
              <option value="">거래전체</option>
              <option value="SALE">매매</option>
              <option value="JEONSE">전세</option>
              <option value="MONTHLY_RENT">월세</option>
            </select>
            <input v-model.number="listingFilter.page" type="number" placeholder="page" class="input-sm w-16" />
            <input v-model.number="listingFilter.size" type="number" placeholder="size" class="input-sm w-16" />
            <RunBtn :loading="results['listings-list']?.loading"
              @click="run('listings-list', () => listingsApi.getList({ dealType: listingFilter.dealType as any || undefined, page: listingFilter.page, size: listingFilter.size }))" />
          </div>
          <ResponseBox :result="results['listings-list']" />
        </TestCard>

        <!-- Get By Id -->
        <TestCard method="GET" endpoint="/api/listings/:id">
          <div class="flex gap-2">
            <input v-model.number="listingId" type="number" placeholder="id" class="input-sm w-24" />
            <RunBtn :loading="results['listing-detail']?.loading"
              @click="run('listing-detail', () => listingsApi.getById(listingId))" />
          </div>
          <ResponseBox :result="results['listing-detail']" />
        </TestCard>

        <!-- Get My -->
        <TestCard method="GET" endpoint="/api/listings/my">
          <RunBtn :loading="results['my-listings']?.loading"
            @click="run('my-listings', () => listingsApi.getMy())" />
          <ResponseBox :result="results['my-listings']" />
        </TestCard>

        <!-- Get Bookmarks -->
        <TestCard method="GET" endpoint="/api/listings/bookmarks">
          <RunBtn :loading="results['listing-bookmarks']?.loading"
            @click="run('listing-bookmarks', () => listingsApi.getBookmarks())" />
          <ResponseBox :result="results['listing-bookmarks']" />
        </TestCard>
      </template>

      <!-- ── 실거래가 ────────────────────────────────── -->
      <template v-if="activeTab === 'market'">
        <!-- Get List -->
        <TestCard method="GET" endpoint="/api/market">
          <div class="flex gap-2 flex-wrap">
            <input v-model="marketFilter.districtCode" placeholder="법정동코드" class="input-sm w-28" />
            <select v-model="marketFilter.dealType" class="input-sm w-24">
              <option value="">거래전체</option>
              <option value="SALE">매매</option>
              <option value="JEONSE">전세</option>
              <option value="MONTHLY_RENT">월세</option>
            </select>
            <input v-model.number="marketFilter.size" type="number" placeholder="size" class="input-sm w-16" />
            <RunBtn :loading="results['market-list']?.loading"
              @click="run('market-list', () => marketApi.getList({ districtCode: marketFilter.districtCode || undefined, dealType: marketFilter.dealType as any || undefined, size: marketFilter.size }))" />
          </div>
          <ResponseBox :result="results['market-list']" />
        </TestCard>

        <!-- Get By Id -->
        <TestCard method="GET" endpoint="/api/market/:id">
          <div class="flex gap-2">
            <input v-model.number="marketId" type="number" placeholder="id" class="input-sm w-24" />
            <RunBtn :loading="results['market-detail']?.loading"
              @click="run('market-detail', () => marketApi.getById(marketId))" />
          </div>
          <ResponseBox :result="results['market-detail']" />
        </TestCard>
      </template>

      <!-- ── 채팅 ───────────────────────────────────── -->
      <template v-if="activeTab === 'chat'">
        <!-- Get Rooms -->
        <TestCard method="GET" endpoint="/api/chat/rooms">
          <RunBtn :loading="results['chat-rooms']?.loading"
            @click="run('chat-rooms', () => chatApi.getRooms())" />
          <ResponseBox :result="results['chat-rooms']" />
        </TestCard>

        <!-- Get or Create Room -->
        <TestCard method="POST" endpoint="/api/chat/rooms">
          <div class="flex gap-2">
            <input v-model.number="chatListingId" type="number" placeholder="listingId" class="input-sm w-28" />
            <RunBtn :loading="results['chat-create']?.loading"
              @click="run('chat-create', () => chatApi.getOrCreateRoom(chatListingId))" />
          </div>
          <ResponseBox :result="results['chat-create']" />
        </TestCard>
      </template>

      <!-- ── AI 분석 ─────────────────────────────────── -->
      <template v-if="activeTab === 'ai'">
        <!-- Price Analysis -->
        <TestCard method="POST" endpoint="/api/ai/price">
          <div class="flex gap-2">
            <input v-model.number="aiTargetId" type="number" placeholder="targetId (매물ID)" class="input-sm w-36" />
            <RunBtn :loading="results['ai-price']?.loading"
              @click="run('ai-price', () => aiApi.analyzePrice({ targetId: aiTargetId }))" />
          </div>
          <ResponseBox :result="results['ai-price']" />
        </TestCard>

        <!-- AI History -->
        <TestCard method="GET" endpoint="/api/ai/history">
          <RunBtn :loading="results['ai-history']?.loading"
            @click="run('ai-history', () => aiApi.getHistory())" />
          <ResponseBox :result="results['ai-history']" />
        </TestCard>
      </template>
    </div>
  </div>
</template>

<!-- ── 서브 컴포넌트 (인라인) ───────────────────────────── -->
<script lang="ts">
import { defineComponent, h, type PropType } from 'vue'

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  PUT: 'bg-yellow-100 text-yellow-700',
}

export const TestCard = defineComponent({
  props: {
    method: { type: String as PropType<'GET' | 'POST' | 'PUT' | 'DELETE'>, required: true },
    endpoint: { type: String, required: true },
  },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'bg-white rounded-xl border border-gray-200 p-4 space-y-3' }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h('span', { class: `text-xs font-bold px-2 py-0.5 rounded ${METHOD_COLOR[props.method]}` }, props.method),
          h('code', { class: 'text-sm text-gray-700 font-mono' }, props.endpoint),
        ]),
        slots.default?.(),
      ])
  },
})

export const RunBtn = defineComponent({
  props: { loading: Boolean },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        class: 'px-4 py-1.5 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 shrink-0',
        disabled: props.loading,
        onClick: () => emit('click'),
      }, props.loading ? '실행 중...' : '실행')
  },
})

export const ResponseBox = defineComponent({
  props: { result: { type: Object as PropType<any>, default: null } },
  setup(props) {
    return () => {
      if (!props.result || props.result.loading) return null
      const isError = !!props.result.error
      return h('div', {
        class: `mt-1 rounded-lg p-3 font-mono text-xs overflow-auto max-h-60 ${isError ? 'bg-red-50 text-red-800' : 'bg-gray-50 text-gray-800'}`,
      }, [
        props.result.status
          ? h('div', { class: `mb-1 font-semibold ${isError ? 'text-red-600' : 'text-green-600'}` }, `HTTP ${props.result.status}`)
          : null,
        h('pre', {}, JSON.stringify(isError ? props.result.error : props.result.data, null, 2)),
      ])
    }
  },
})
</script>

<style scoped>
@reference "tailwindcss";

.input-sm {
  @apply px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500;
}
</style>
