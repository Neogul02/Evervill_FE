<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { listingsApi } from '@/api'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{
  listingId: number
  initialPrice?: number | null
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  submitted: [price: number]
}>()

const price = ref(props.initialPrice ? String(props.initialPrice) : '')
const submitting = ref(false)
const error = ref('')
const priceInput = ref<HTMLInputElement | null>(null)

async function onSubmit() {
  const parsed = Number(price.value)
  if (!price.value || Number.isNaN(parsed) || parsed <= 0) {
    error.value = '복비(만원 단위)를 올바르게 입력해주세요.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await listingsApi.submitOffer(props.listingId, parsed)
    emit('submitted', parsed)
    open.value = false
  } catch (e: any) {
    error.value = e.response?.data?.message ?? '제안에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    submitting.value = false
  }
}

const backdropReady = ref(false)
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  setTimeout(() => { backdropReady.value = true }, 150)
  nextTick(() => priceInput.value?.focus())
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
function onBackdropClick() {
  if (backdropReady.value) open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="복비 가격 제안"
    >
      <div class="absolute inset-0 bg-black/55" @click="onBackdropClick" @touchend.prevent="onBackdropClick" />

      <div class="modal-panel relative w-full max-w-sm rounded-2xl bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border shadow-2xl overflow-hidden">
        <div class="h-1 w-full bg-accent shrink-0" />

        <form class="px-6 pt-5 pb-6" @submit.prevent="onSubmit">
          <h2 class="text-base font-bold text-ink dark:text-dark-text mb-2 tracking-tight">
            {{ initialPrice ? '제안 수정하기' : '복비 가격 제안하기' }}
          </h2>
          <p class="text-sm text-ink-muted dark:text-dark-muted leading-relaxed mb-4">
            이 매물의 거래 상대에게 보여줄 중개 수수료(복비)를 입력해주세요. 만원 단위입니다.
          </p>

          <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">복비 (만원)</label>
          <input
            ref="priceInput"
            v-model="price"
            type="number"
            min="1"
            step="1"
            placeholder="예: 500"
            class="no-spinner w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
          />

          <p v-if="error" class="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded mt-3">
            {{ error }}
          </p>

          <div class="flex gap-2 mt-6 justify-end">
            <BaseButton type="button" variant="utility" size="sm" @click="open = false">취소</BaseButton>
            <BaseButton type="submit" variant="primary" size="sm" :disabled="submitting">
              {{ submitting ? '제안 중...' : initialPrice ? '수정하기' : '제안하기' }}
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-spinner {
  -moz-appearance: textfield;
}

.modal-panel {
  animation: modal-pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
