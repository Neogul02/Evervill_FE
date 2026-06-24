<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import NavProgressBar from '@/components/layout/NavProgressBar.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const { init } = useTheme()
init()

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
</template>
