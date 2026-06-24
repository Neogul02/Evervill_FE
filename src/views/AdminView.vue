<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { adminApi } from '@/api/admin'
import type { AdminNoticeResponse, AdminNoticeRequest, AdminReportResponse } from '@/api/admin'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Badge from '@/components/ui/Badge.vue'
import type { BadgeTone } from '@/constants/dealTypeColors'
import type { DealerApplication, DealerStatus } from '@/types'

type Tab = 'notices' | 'reports' | 'dealers' | 'batch'

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

const dealerApplications = ref<DealerApplication[]>([])
const dealerLoading = ref(false)
const dealerStatusFilter = ref<DealerStatus | ''>('PENDING')

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

async function fetchDealerApplications() {
  dealerLoading.value = true
  try {
    const res = await adminApi.getDealerApplications(dealerStatusFilter.value || undefined)
    dealerApplications.value = res.data.data
  } finally {
    dealerLoading.value = false
  }
}

async function approveDealer(id: number) {
  try {
    await adminApi.approveDealer(id)
    dealerApplications.value = dealerApplications.value.filter(d => d.id !== id)
  } catch {
    alert('승인에 실패했습니다.')
  }
}

async function rejectDealer(id: number) {
  if (!confirm('가입 신청을 거부하시겠습니까?')) return
  try {
    await adminApi.rejectDealer(id)
    dealerApplications.value = dealerApplications.value.filter(d => d.id !== id)
  } catch {
    alert('거부 처리에 실패했습니다.')
  }
}

function dealerStatusLabel(status: DealerStatus) {
  const map: Record<DealerStatus, string> = { NONE: '-', PENDING: '대기', APPROVED: '승인', REJECTED: '거부' }
  return map[status]
}

function dealerStatusTone(status: DealerStatus): BadgeTone {
  if (status === 'PENDING') return 'amber'
  if (status === 'APPROVED') return 'green'
  if (status === 'REJECTED') return 'rose'
  return 'neutral'
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

function statusTone(status: string): BadgeTone {
  if (status === 'PENDING') return 'amber'
  if (status === 'PROCESSED') return 'green'
  return 'neutral'
}

function noticeTypeTone(type: string): BadgeTone {
  return type === 'NOTICE' ? 'sky' : 'violet'
}

async function switchTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'notices' && notices.value.length === 0) await fetchNotices()
  if (tab === 'reports' && reports.value.length === 0) await fetchReports()
  if (tab === 'dealers' && dealerApplications.value.length === 0) await fetchDealerApplications()
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
    <main class="pt-14 max-w-4xl mx-auto w-full px-4 pb-8">
      <h1 class="text-xl font-bold text-ink dark:text-dark-text mb-6 tracking-tight">관리자</h1>

      <!-- 탭 -->
      <div class="flex gap-1 mb-6 border-b border-hairline dark:border-dark-border">
        <button
          v-for="[key, label] in [['notices','공지 관리'],['reports','신고 관리'],['dealers','중개사 승인'],['batch','배치 실행']]"
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
          <BaseButton size="sm" @click="openCreateForm">+ 공지 등록</BaseButton>
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
            maxlength="200"
            placeholder="제목"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent"
          />
          <textarea
            v-model="noticeForm.content"
            rows="4"
            maxlength="5000"
            placeholder="내용"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent resize-none"
          />
          <div class="flex justify-end gap-2">
            <BaseButton variant="secondary" size="sm" @click="closeForm">취소</BaseButton>
            <BaseButton size="sm" :disabled="noticeSubmitting" @click="submitNotice">{{ noticeSubmitting ? '저장 중...' : '저장' }}</BaseButton>
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
                <Badge :tone="noticeTypeTone(notice.noticeType)">{{ notice.noticeType === 'NOTICE' ? '공지' : '이벤트' }}</Badge>
                <Badge v-if="!notice.active" tone="neutral">비활성</Badge>
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
              <Badge class="shrink-0" :tone="statusTone(report.status)">{{ statusLabel(report.status) }}</Badge>
            </div>
            <div v-if="report.status === 'PENDING'" class="flex gap-2 justify-end">
              <BaseButton size="sm" @click="updateReportStatus(report.id, 'PROCESSED')">처리</BaseButton>
              <BaseButton variant="secondary" size="sm" @click="updateReportStatus(report.id, 'DISMISSED')">기각</BaseButton>
            </div>
          </div>
          <div v-if="reports.length === 0" class="text-center text-sm text-ink-faint dark:text-dark-muted py-12">신고가 없습니다</div>
        </div>
      </template>

      <!-- 중개사 승인 탭 -->
      <template v-else-if="activeTab === 'dealers'">
        <div class="flex items-center gap-3 mb-4">
          <select
            v-model="dealerStatusFilter"
            @change="fetchDealerApplications"
            class="px-3 py-1.5 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="">전체</option>
            <option value="PENDING">대기</option>
            <option value="APPROVED">승인</option>
            <option value="REJECTED">거부</option>
          </select>
        </div>

        <div v-if="dealerLoading" class="flex justify-center py-12">
          <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else class="divide-y divide-hairline dark:divide-dark-border border border-hairline dark:border-dark-border rounded-xl overflow-hidden bg-canvas dark:bg-dark-surface">
          <div v-for="application in dealerApplications" :key="application.id" class="p-4">
            <div class="flex items-start justify-between gap-4 mb-2">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-ink dark:text-dark-text truncate">{{ application.nickname }}</p>
                <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">{{ application.email }}</p>
                <p class="text-xs text-ink-faint dark:text-dark-muted mt-0.5">{{ application.realEstateLocation }} · 등록번호 {{ application.brokerRegistrationNumber }}</p>
                <p class="text-xs text-ink-faint dark:text-dark-muted">{{ formatDate(application.createdAt) }}</p>
                <div class="flex gap-3 mt-1.5">
                  <a :href="application.businessRegistrationFileUrl" target="_blank" rel="noopener" class="text-xs text-accent hover:underline">사업자 등록증 보기</a>
                  <a :href="application.brokerLicenseFileUrl" target="_blank" rel="noopener" class="text-xs text-accent hover:underline">중개업 자격증 보기</a>
                </div>
              </div>
              <Badge class="shrink-0" :tone="dealerStatusTone(application.dealerStatus)">{{ dealerStatusLabel(application.dealerStatus) }}</Badge>
            </div>
            <div v-if="application.dealerStatus === 'PENDING'" class="flex gap-2 justify-end">
              <BaseButton size="sm" @click="approveDealer(application.id)">승인</BaseButton>
              <BaseButton variant="secondary" size="sm" @click="rejectDealer(application.id)">거부</BaseButton>
            </div>
          </div>
          <div v-if="dealerApplications.length === 0" class="text-center text-sm text-ink-faint dark:text-dark-muted py-12">가입 신청이 없습니다</div>
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
            <BaseButton :disabled="batchLoading" @click="triggerBatch">{{ batchLoading ? '실행 중...' : '실행' }}</BaseButton>
          </div>
          <p v-if="batchMessage" class="mt-3 text-sm px-3 py-2 rounded"
            :class="batchMessage.includes('완료') ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'"
          >{{ batchMessage }}</p>
        </div>
      </template>
    </main>
  </div>
</template>
