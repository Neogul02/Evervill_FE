<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useConfirmModal } from '@/composables/useConfirmModal'
import NavProgressBar from '@/components/layout/NavProgressBar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const { init } = useTheme()
init()

// 전역 모달 — 모든 컴포넌트에서 useConfirmModal().open()으로 호출
const { visible, options, confirm, cancel } = useConfirmModal()

onMounted(() => {
  // 자주 가는 메인 라우트 청크를 미리 받아 nav 클릭 시 다운로드 대기 없이 즉시 전환
  setTimeout(() => {
    import('@/views/HomeView.vue')
    import('@/views/MarketView.vue')
    import('@/views/NoticesView.vue')
  }, 1000)
})
</script>

<template>
  <NavProgressBar />
  <ToastContainer />
  <RouterView />

  <!-- 전역 확인 모달 — App 루트에서 단 하나만 렌더링 -->
  <ConfirmModal
    v-if="visible"
    :title="options.title"
    :message="options.message"
    :confirm-text="options.confirmText"
    :cancel-text="options.cancelText"
    :danger="options.danger"
    @confirm="confirm"
    @cancel="cancel"
  />
</template>
