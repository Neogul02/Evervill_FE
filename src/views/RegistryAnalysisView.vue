<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShieldCheck, ShieldAlert, ShieldX, FileText, Search } from 'lucide-vue-next'
import { aiApi } from '@/api/ai'
import type { AiAnalysis, RiskLevel } from '@/types/ai'
import { RISK_LEVEL_LABEL, RISK_LEVEL_TONE } from '@/constants/aiRisk'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Badge from '@/components/ui/Badge.vue'

const file = ref<File | null>(null)
const previewUrl = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<AiAnalysis | null>(null)
const history = ref<AiAnalysis[]>([])
const historyLoading = ref(false)

const RISK_ICON: Record<RiskLevel, typeof ShieldCheck> = {
  SAFE: ShieldCheck,
  CAUTION: ShieldAlert,
  DANGER: ShieldX,
}

const sortedHistory = computed(() =>
  [...history.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
)
const latest = computed(() => result.value ?? sortedHistory.value[0] ?? null)

const totalCount = computed(() => history.value.length)
const cautionCount = computed(() => history.value.filter((a) => a.riskLevel === 'CAUTION').length)
const dangerCount = computed(() => history.value.filter((a) => a.riskLevel === 'DANGER').length)

function handleFileSelect(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  file.value = f
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = f.type.startsWith('image/') ? URL.createObjectURL(f) : ''
}

function removeFile() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  file.value = null
  previewUrl.value = ''
}

async function onSubmit() {
  if (!file.value) {
    error.value = '등기부등본 파일을 선택해주세요.'
    return
  }
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const res = await aiApi.analyzeRegistry(file.value)
    result.value = res.data.data
    removeFile()
    await fetchHistory()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? '분석에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}

async function fetchHistory() {
  historyLoading.value = true
  try {
    const res = await aiApi.getMyAnalyses()
    history.value = res.data.data.filter((a) => a.analysisType === 'REGISTRY')
  } catch {
    // 조용히 실패 — 이력은 보조 정보일 뿐
  } finally {
    historyLoading.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

onMounted(fetchHistory)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base ">
    <AppHeader />

    <main class="flex-1 max-w-5xl mx-auto w-full px-4 pt-14 pb-8">
      <div class="py-6">
        <h1 class="text-2xl font-bold text-ink dark:text-dark-text mt-2 tracking-tight">AI 등기부등본 분석</h1>
        <p class="text-sm text-ink-muted dark:text-dark-muted mt-1">
          등기부등본 파일(PDF 또는 이미지)을 업로드하면 AI가 임차인 관점에서의 위험 요소를 분석합니다.
        </p>
      </div>

      <div class="grid md:grid-cols-[1fr_320px] gap-5">
        <!-- 좌측: 최신 결과 + 업로드 -->
        <div class="space-y-5 min-w-0">
          <!-- 최신 분석 결과(히어로) -->
          <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-6">
            <template v-if="latest">
              <div class="flex items-start gap-4">
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  :class="{
                    'bg-accent-light dark:bg-accent-dark-muted': latest.riskLevel === 'SAFE',
                    'bg-accent-amber-light dark:bg-accent-amber-dark': latest.riskLevel === 'CAUTION',
                    'bg-accent-rose-light dark:bg-accent-rose-dark': latest.riskLevel === 'DANGER',
                  }"
                >
                  <component
                    :is="RISK_ICON[latest.riskLevel ?? 'SAFE']"
                    class="w-6 h-6"
                    :class="{
                      'text-accent-hover dark:text-accent': latest.riskLevel === 'SAFE',
                      'text-accent-amber dark:text-accent-amber': latest.riskLevel === 'CAUTION',
                      'text-accent-rose dark:text-accent-rose': latest.riskLevel === 'DANGER',
                    }"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-xs font-medium text-ink-faint dark:text-dark-muted">최근 분석 결과</p>
                    <Badge :tone="RISK_LEVEL_TONE[latest.riskLevel ?? 'SAFE']">{{ RISK_LEVEL_LABEL[latest.riskLevel ?? 'SAFE'] }}</Badge>
                  </div>
                  <p class="text-xs text-ink-faint dark:text-dark-muted mt-1">{{ formatDate(latest.createdAt) }}</p>
                  <p class="text-sm text-ink-secondary dark:text-dark-text whitespace-pre-line leading-relaxed mt-3 max-h-64 overflow-y-auto pr-1">
                    {{ latest.resultSummary }}
                  </p>
                </div>
              </div>
            </template>
            <div v-else class="flex flex-col items-center gap-2 py-8 text-center">
              <Search class="w-8 h-8 text-ink-faint dark:text-dark-muted" />
              <p class="text-sm font-medium text-ink dark:text-dark-text">아직 분석한 등기부등본이 없어요</p>
              <p class="text-xs text-ink-faint dark:text-dark-muted">아래에서 파일을 업로드해 첫 분석을 시작해보세요.</p>
            </div>
          </div>

          <!-- 업로드 폼 -->
          <form class="space-y-3" @submit.prevent="onSubmit">
            <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5">
              <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-3">새 분석 실행</label>

              <div v-if="!file" class="flex">
                <label class="flex-1 h-28 rounded-lg border-2 border-dashed border-hairline dark:border-dark-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent transition-colors">
                  <span class="text-2xl text-ink-faint dark:text-dark-muted">+</span>
                  <span class="text-xs text-ink-faint dark:text-dark-muted">PDF 또는 이미지 파일 선택</span>
                  <input type="file" accept="application/pdf,image/*" class="hidden" @change="handleFileSelect" />
                </label>
              </div>

              <div v-else class="flex items-center gap-3 p-3 border border-hairline dark:border-dark-border rounded-lg">
                <img v-if="previewUrl" :src="previewUrl" class="w-14 h-14 rounded object-cover shrink-0" />
                <div v-else class="w-14 h-14 rounded bg-canvas-soft dark:bg-dark-elevated flex items-center justify-center text-xs text-ink-faint dark:text-dark-muted shrink-0">PDF</div>
                <p class="flex-1 text-sm text-ink dark:text-dark-text truncate">{{ file.name }}</p>
                <button type="button" @click="removeFile" class="text-xs text-red-500 hover:underline cursor-pointer shrink-0">제거</button>
              </div>
            </div>

            <p v-if="error" class="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">
              {{ error }}
            </p>

            <BaseButton type="submit" :disabled="loading || !file" class="w-full">
              {{ loading ? '분석 중...' : '분석 시작' }}
            </BaseButton>
          </form>
        </div>

        <!-- 우측: 통계 + 이력 -->
        <div class="space-y-5 min-w-0">
          <div class="grid grid-cols-3 md:grid-cols-1 gap-2.5">
            <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4 flex md:items-center md:justify-between items-start gap-2 flex-col md:flex-row">
              <div class="flex items-center gap-2">
                <FileText class="w-4 h-4 text-ink-faint dark:text-dark-muted shrink-0" />
                <p class="text-xs text-ink-faint dark:text-dark-muted">총 분석 건수</p>
              </div>
              <p class="text-lg font-bold text-ink dark:text-dark-text">{{ totalCount }}</p>
            </div>
            <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4 flex md:items-center md:justify-between items-start gap-2 flex-col md:flex-row">
              <div class="flex items-center gap-2">
                <ShieldAlert class="w-4 h-4 text-accent-amber shrink-0" />
                <p class="text-xs text-ink-faint dark:text-dark-muted">주의 등급</p>
              </div>
              <p class="text-lg font-bold text-accent-amber">{{ cautionCount }}</p>
            </div>
            <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-4 flex md:items-center md:justify-between items-start gap-2 flex-col md:flex-row">
              <div class="flex items-center gap-2">
                <ShieldX class="w-4 h-4 text-accent-rose shrink-0" />
                <p class="text-xs text-ink-faint dark:text-dark-muted">위험 등급</p>
              </div>
              <p class="text-lg font-bold text-accent-rose">{{ dangerCount }}</p>
            </div>
          </div>

          <!-- 분석 이력 -->
          <div>
            <h2 class="text-sm font-semibold text-ink dark:text-dark-text mb-2">분석 이력</h2>
            <div v-if="historyLoading" class="flex justify-center py-6">
              <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <div v-else-if="sortedHistory.length === 0" class="text-sm text-ink-faint dark:text-dark-muted py-4 text-center bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border rounded-xl">
              분석 이력이 없습니다.
            </div>
            <div v-else class="divide-y divide-hairline dark:divide-dark-border border border-hairline dark:border-dark-border rounded-xl overflow-hidden bg-canvas dark:bg-dark-surface">
              <div v-for="a in sortedHistory" :key="a.id" class="p-3.5">
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <Badge :tone="RISK_LEVEL_TONE[a.riskLevel ?? 'SAFE']">{{ RISK_LEVEL_LABEL[a.riskLevel ?? 'SAFE'] }}</Badge>
                  <span class="text-xs text-ink-faint dark:text-dark-muted shrink-0">{{ formatDate(a.createdAt) }}</span>
                </div>
                <p class="text-xs text-ink-muted dark:text-dark-muted line-clamp-2 whitespace-pre-line">{{ a.resultSummary }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
