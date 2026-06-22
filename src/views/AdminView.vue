<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { adminApi } from '@/api/admin'
import type { AdminNoticeResponse, AdminNoticeRequest, AdminReportResponse } from '@/api/admin'
import AppHeader from '@/components/layout/AppHeader.vue'

type Tab = 'notices' | 'reports' | 'batch'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<Tab>('notices')

const notices = ref<AdminNoticeResponse[]>([])
const noticeLoading = ref(false)
const showNoticeForm = ref(false)
const editingNotice = ref<AdminNoticeResponse | null>(null)
const noticeForm = ref<AdminNoticeRequest>({ title: '', content: '', noticeType: 'NOTICE', active: true })
const noticeSubmitting = ref(false)

const reports = ref<AdminReportResponse[]>([])
const reportLoading = ref(false)
const reportStatusFilter = ref('')

const batchYearMonth = ref('')
const batchLoading = ref(false)
const batchMessage = ref('')

async function fetchNotices() {
  noticeLoading.value = true
  try {
    const res = await adminApi.getNotices()
    notices.value = res.data.data
  } finally {
    noticeLoading.value = false
  }
}

async function fetchReports() {
  reportLoading.value = true
  try {
    const res = await adminApi.getReports(reportStatusFilter.value || undefined)
    reports.value = res.data.data
  } finally {
    reportLoading.value = false
  }
}

function openCreateForm() {
  editingNotice.value = null
  noticeForm.value = { title: '', content: '', noticeType: 'NOTICE', active: true }
  showNoticeForm.value = true
}

function openEditForm(notice: AdminNoticeResponse) {
  editingNotice.value = notice
  noticeForm.value = {
    title: notice.title,
    content: notice.content,
    noticeType: notice.noticeType,
    active: notice.active,
    startAt: notice.startAt,
    endAt: notice.endAt,
  }
  showNoticeForm.value = true
}

function closeForm() {
  showNoticeForm.value = false
  editingNotice.value = null
}

async function submitNotice() {
  if (!noticeForm.value.title || !noticeForm.value.content) return
  noticeSubmitting.value = true
  try {
    if (editingNotice.value) {
      await adminApi.updateNotice(editingNotice.value.id, noticeForm.value)
    } else {
      await adminApi.createNotice(noticeForm.value)
    }
    closeForm()
    await fetchNotices()
  } finally {
    noticeSubmitting.value = false
  }
}

async function deleteNotice(id: number) {
  if (!confirm('공지를 삭제하시겠습니까?')) return
  try {
    await adminApi.deleteNotice(id)
    notices.value = notices.value.filter(n => n.id !== id)
  } catch {
    alert('삭제에 실패했습니다.')
  }
}

async function updateReportStatus(id: number, status: 'PROCESSED' | 'DISMISSED') {
  try {
    await adminApi.updateReportStatus(id, status)
    const report = reports.value.find(r => r.id === id)
    if (report) report.status = status
  } catch {
    alert('상태 변경에 실패했습니다.')
  }
}

async function triggerBatch() {
  if (!batchYearMonth.value || !/^\d{6}$/.test(batchYearMonth.value)) {
    batchMessage.value = 'YYYYMM 형식으로 입력하세요 (예: 202605)'
    return
  }
  batchLoading.value = true
  batchMessage.value = ''
  try {
    await adminApi.triggerMarketBatch(batchYearMonth.value)
    batchMessage.value = `${batchYearMonth.value} 배치 실행 요청이 완료됐습니다.`
  } catch (e: any) {
    batchMessage.value = e.response?.data?.message ?? '배치 실행에 실패했습니다.'
  } finally {
    batchLoading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

function statusLabel(status: string) {
  const map: Record<string, string> = { PENDING: '대기', PROCESSED: '처리됨', DISMISSED: '기각' }
  return map[status] ?? status
}

function statusColor(status: string) {
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (status === 'PROCESSED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  return 'bg-canvas-soft text-ink-faint dark:bg-dark-elevated dark:text-dark-muted'
}

async function switchTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'notices' && notices.value.length === 0) await fetchNotices()
  if (tab === 'reports' && reports.value.length === 0) await fetchReports()
}

onMounted(async () => {
  if (!authStore.isAuthenticated || authStore.user?.role !== 'ADMIN') {
    router.replace('/')
    return
  }
  await fetchNotices()
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />
    <main class="pt-14 max-w-4xl mx-auto w-full px-4 py-8">
      <h1 class="text-xl font-bold text-ink dark:text-dark-text mb-6 tracking-tight">관리자</h1>

      <!-- 탭 -->
      <div class="flex gap-1 mb-6 border-b border-hairline dark:border-dark-border">
        <button
          v-for="[key, label] in [['notices','공지 관리'],['reports','신고 관리'],['batch','배치 실행']]"
          :key="key"
          @click="switchTab(key as Tab)"
          class="px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px"
          :class="activeTab === key
            ? 'border-accent text-accent'
            : 'border-transparent text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text'"
        >{{ label }}</button>
      </div>

      <!-- 공지 관리 탭 -->
      <template v-if="activeTab === 'notices'">
        <div class="flex justify-end mb-4">
          <button
            @click="openCreateForm"
            class="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-full transition-all cursor-pointer active:scale-[0.98]"
          >
            + 공지 등록
          </button>
        </div>

        <!-- 공지 폼 -->
        <div v-if="showNoticeForm" class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5 mb-4 space-y-3">
          <h3 class="text-sm font-semibold text-ink dark:text-dark-text">{{ editingNotice ? '공지 수정' : '공지 등록' }}</h3>
          <div class="flex gap-2">
            <button
              v-for="[val, lbl] in [['NOTICE','공지'],['EVENT','이벤트']]"
              :key="val"
              type="button"
              @click="noticeForm.noticeType = val as 'NOTICE'|'EVENT'"
              class="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer"
              :class="noticeForm.noticeType === val ? 'bg-accent text-white border-accent' : 'border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted'"
            >{{ lbl }}</button>
          </div>
          <label class="flex items-center gap-2 text-sm text-ink-muted dark:text-dark-muted cursor-pointer">
            <input type="checkbox" v-model="noticeForm.active" class="cursor-pointer" />
            활성화
          </label>
          <input
            v-model="noticeForm.title"
            type="text"
            placeholder="제목"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
          />
          <textarea
            v-model="noticeForm.content"
            rows="4"
            placeholder="내용"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent resize-none"
          />
          <div class="flex justify-end gap-2">
            <button @click="closeForm" class="px-4 py-1.5 text-sm text-ink-muted dark:text-dark-muted hover:text-ink cursor-pointer">취소</button>
            <button
              @click="submitNotice"
              :disabled="noticeSubmitting"
              class="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-full disabled:opacity-50 cursor-pointer"
            >{{ noticeSubmitting ? '저장 중...' : '저장' }}</button>
          </div>
        </div>

        <div v-if="noticeLoading" class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else class="divide-y divide-hairline dark:divide-dark-border border border-hairline dark:border-dark-border rounded-xl overflow-hidden bg-canvas dark:bg-dark-surface">
          <div
            v-for="notice in notices"
            :key="notice.id"
            class="p-4 flex items-start justify-between gap-4"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="notice.noticeType === 'NOTICE' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'"
                >{{ notice.noticeType === 'NOTICE' ? '공지' : '이벤트' }}</span>
                <span v-if="!notice.active" class="text-xs px-2 py-0.5 rounded-full bg-canvas-soft text-ink-faint dark:bg-dark-elevated dark:text-dark-muted">비활성</span>
              </div>
              <p class="text-sm font-medium text-ink dark:text-dark-text truncate">{{ notice.title }}</p>
              <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">{{ formatDate(notice.createdAt) }}</p>
            </div>
            <div class="flex gap-3 shrink-0">
              <button @click="openEditForm(notice)" class="text-xs text-accent hover:underline cursor-pointer">수정</button>
              <button @click="deleteNotice(notice.id)" class="text-xs text-red-500 hover:underline cursor-pointer">삭제</button>
            </div>
          </div>
          <div v-if="notices.length === 0" class="text-center text-sm text-ink-faint dark:text-dark-muted py-12">공지사항이 없습니다</div>
        </div>
      </template>

      <!-- 신고 관리 탭 -->
      <template v-else-if="activeTab === 'reports'">
        <div class="flex items-center gap-3 mb-4">
          <select
            v-model="reportStatusFilter"
            @change="fetchReports"
            class="px-3 py-1.5 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="">전체</option>
            <option value="PENDING">대기</option>
            <option value="PROCESSED">처리됨</option>
            <option value="DISMISSED">기각</option>
          </select>
        </div>

        <div v-if="reportLoading" class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else class="divide-y divide-hairline dark:divide-dark-border border border-hairline dark:border-dark-border rounded-xl overflow-hidden bg-canvas dark:bg-dark-surface">
          <div v-for="report in reports" :key="report.id" class="p-4">
            <div class="flex items-start justify-between gap-4 mb-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-ink dark:text-dark-text truncate">{{ report.listingTitle }}</p>
                <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">신고 사유: {{ report.reason }}</p>
                <p class="text-xs text-ink-faint dark:text-dark-muted">{{ formatDate(report.createdAt) }}</p>
              </div>
              <span class="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium" :class="statusColor(report.status)">
                {{ statusLabel(report.status) }}
              </span>
            </div>
            <div v-if="report.status === 'PENDING'" class="flex gap-2 justify-end">
              <button
                @click="updateReportStatus(report.id, 'PROCESSED')"
                class="text-xs px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full cursor-pointer transition-colors"
              >처리</button>
              <button
                @click="updateReportStatus(report.id, 'DISMISSED')"
                class="text-xs px-3 py-1 border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:border-ink-muted rounded-full cursor-pointer transition-colors"
              >기각</button>
            </div>
          </div>
          <div v-if="reports.length === 0" class="text-center text-sm text-ink-faint dark:text-dark-muted py-12">신고가 없습니다</div>
        </div>
      </template>

      <!-- 배치 실행 탭 -->
      <template v-else>
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-6 max-w-md">
          <h3 class="text-sm font-semibold text-ink dark:text-dark-text mb-1">실거래가 배치 수동 실행</h3>
          <p class="text-xs text-ink-faint dark:text-dark-muted mb-4">국토부 실거래가 데이터를 특정 월 기준으로 수집합니다.</p>
          <div class="flex gap-3">
            <input
              v-model="batchYearMonth"
              type="text"
              placeholder="YYYYMM (예: 202605)"
              maxlength="6"
              class="flex-1 px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
            />
            <button
              @click="triggerBatch"
              :disabled="batchLoading"
              class="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-full disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
            >{{ batchLoading ? '실행 중...' : '실행' }}</button>
          </div>
          <p v-if="batchMessage" class="mt-3 text-sm px-3 py-2 rounded"
            :class="batchMessage.includes('완료') ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'"
          >{{ batchMessage }}</p>
        </div>
      </template>
    </main>
  </div>
</template>
