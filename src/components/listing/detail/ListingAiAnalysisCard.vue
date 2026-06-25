<script setup lang="ts">
import { ref } from 'vue'
import { Lightbulb, Loader2 } from 'lucide-vue-next'
import type { AiAnalysis } from '@/types/ai'
import { aiApi } from '@/api'
import BaseButton from '@/components/ui/BaseButton.vue'
import Badge from '@/components/ui/Badge.vue'
import { RISK_LEVEL_LABEL, RISK_LEVEL_TONE } from '@/constants/aiRisk'

const props = defineProps<{
  listingId: number
}>()

const aiResult = ref<AiAnalysis | null>(null)
const aiLoading = ref(false)
const aiError = ref('')

async function runAiAnalysis() {
  if (aiLoading.value) return
  aiLoading.value = true
  aiError.value = ''
  aiResult.value = null
  try {
    const res = await aiApi.analyzePrice(props.listingId)
    aiResult.value = res.data.data
  } catch {
    aiError.value = 'AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    aiLoading.value = false
  }
}
</script>

<template>
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
      <div v-if="aiResult.riskLevel" class="flex items-center gap-2">
        <Badge :tone="RISK_LEVEL_TONE[aiResult.riskLevel]">{{ RISK_LEVEL_LABEL[aiResult.riskLevel] }}</Badge>
      </div>
      <p class="text-xs text-ink-muted dark:text-dark-muted leading-relaxed whitespace-pre-line">
        {{ aiResult.resultSummary }}
      </p>
    </div>

    <!-- 미실행 상태 -->
    <p v-else-if="!aiLoading && !aiError" class="text-xs text-ink-faint dark:text-dark-muted">
      실거래가 데이터를 기반으로 이 매물의 가격 적정성을 분석합니다.
    </p>

    <!-- 에러 -->
    <p v-if="aiError" class="text-xs text-red-500 dark:text-red-400">{{ aiError }}</p>
  </div>
</template>
