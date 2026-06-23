<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { aiApi } from '@/api/ai'
import type { AiAnalysis, RiskLevel } from '@/types/ai'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const router = useRouter()

const file = ref<File | null>(null)
const previewUrl = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<AiAnalysis | null>(null)
const history = ref<AiAnalysis[]>([])
const historyLoading = ref(false)

const RISK_LABEL: Record<RiskLevel, string> = {
  SAFE: '안전',
  CAUTION: '주의',
  DANGER: '위험',
}
const RISK_COLOR: Record<RiskLevel, string> = {
  SAFE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CAUTION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DANGER: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

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
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />

    <main class="flex-1 max-w-2xl mx-auto w-full px-4 pt-14 pb-8">
      <div class="py-6">
        <button @click="router.back()" class="text-sm text-ink-muted dark:text-dark-muted hover:text-accent flex items-center gap-1 cursor-pointer">
          ← 뒤로
        </button>
        <h1 class="text-xl font-bold text-ink dark:text-dark-text mt-2 tracking-tight">등기부등본 분석</h1>
        <p class="text-sm text-ink-muted dark:text-dark-muted mt-1">
          등기부등본 파일(PDF 또는 이미지)을 업로드하면 AI가 임차인 관점에서의 위험 요소를 분석합니다.
        </p>
      </div>

      <!-- 업로드 폼 -->
      <form class="space-y-3" @submit.prevent="onSubmit">
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5">
          <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-3">등기부등본 파일</label>

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

      <!-- 분석 결과 -->
      <div v-if="result" class="mt-5 bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5 space-y-3">
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="RISK_COLOR[result.riskLevel ?? 'SAFE']">
            {{ RISK_LABEL[result.riskLevel ?? 'SAFE'] }}
          </span>
        </div>
        <p class="text-sm text-ink-secondary dark:text-dark-text whitespace-pre-line leading-relaxed">{{ result.resultSummary }}</p>
      </div>

      <!-- 분석 이력 -->
      <div class="mt-6">
        <h2 class="text-sm font-semibold text-ink dark:text-dark-text mb-2">이전 분석 이력</h2>
        <div v-if="historyLoading" class="flex justify-center py-6">
          <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <div v-else-if="history.length === 0" class="text-sm text-ink-faint dark:text-dark-muted py-4 text-center">
          분석 이력이 없습니다.
        </div>
        <div v-else class="divide-y divide-hairline dark:divide-dark-border border border-hairline dark:border-dark-border rounded-xl overflow-hidden bg-canvas dark:bg-dark-surface">
          <div v-for="a in history" :key="a.id" class="p-4">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="RISK_COLOR[a.riskLevel ?? 'SAFE']">
                {{ RISK_LABEL[a.riskLevel ?? 'SAFE'] }}
              </span>
              <span class="text-xs text-ink-faint dark:text-dark-muted">{{ formatDate(a.createdAt) }}</span>
            </div>
            <p class="text-xs text-ink-muted dark:text-dark-muted line-clamp-2 whitespace-pre-line">{{ a.resultSummary }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
