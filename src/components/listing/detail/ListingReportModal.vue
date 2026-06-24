<script setup lang="ts">
import { ref } from 'vue'
import { listingsApi } from '@/api'

const props = defineProps<{
  listingId: number
}>()

const open = defineModel<boolean>('open', { required: true })

const reportReason = ref('')
const reportLoading = ref(false)

async function submitReport() {
  if (!reportReason.value.trim()) return
  reportLoading.value = true
  try {
    await listingsApi.report(props.listingId, reportReason.value)
    open.value = false
    reportReason.value = ''
    alert('신고가 접수됐습니다.')
  } finally {
    reportLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      @click.self="open = false"
    >
      <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-6 w-full max-w-sm">
        <h3 class="text-base font-semibold text-ink dark:text-dark-text mb-4 tracking-tight">매물 신고</h3>
        <textarea
          v-model="reportReason"
          placeholder="신고 사유를 입력해주세요"
          rows="4"
          maxlength="500"
          class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent resize-none"
        />
        <div class="flex gap-3 mt-4">
          <button
            @click="open = false"
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
</template>
