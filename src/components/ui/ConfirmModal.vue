<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
  }>(),
  {
    title: '확인',
    message: '계속하시겠습니까?',
    confirmText: '확인',
    cancelText: '취소',
    danger: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

// 모바일 ghost-click 방지:
// 모달이 열릴 때 backdrop 이벤트를 짧은 시간 동안 무시한다
const backdropReady = ref(false)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  // 150ms 후에 backdrop 클릭 활성화 → 터치 이벤트 전파로 인한 즉시 닫힘 방지
  setTimeout(() => {
    backdropReady.value = true
  }, 150)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

function onBackdropClick() {
  if (backdropReady.value) emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <!-- 어두운 오버레이 배경 -->
      <div
        class="absolute inset-0 bg-black/55"
        @click="onBackdropClick"
        @touchend.prevent="onBackdropClick"
      />

      <!-- 모달 패널 -->
      <div
        class="modal-panel relative w-full max-w-sm rounded-2xl bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border shadow-2xl overflow-hidden"
      >
        <!-- 상단 컬러 바 -->
        <div
          class="h-1 w-full"
          :class="danger ? 'bg-red-400' : 'bg-accent'"
        />

        <div class="px-6 pt-5 pb-6">
          <!-- 제목 -->
          <h2 class="text-base font-bold text-ink dark:text-dark-text mb-2 tracking-tight">
            {{ title }}
          </h2>

          <!-- 내용 -->
          <p class="text-sm text-ink-muted dark:text-dark-muted leading-relaxed">
            {{ message }}
          </p>

          <!-- 버튼 영역 — BaseButton으로 통일 -->
          <div class="flex gap-2 mt-6 justify-end">
            <BaseButton variant="utility" size="sm" @click="emit('cancel')">
              {{ cancelText }}
            </BaseButton>
            <BaseButton
              :variant="danger ? 'danger' : 'primary'"
              size="sm"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-panel {
  animation: modal-pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.90) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
