<script setup lang="ts">
import { useNavProgress } from '@/composables/useNavProgress'

const { active, progress } = useNavProgress()
</script>

<template>
  <div
    v-if="active"
    class="fixed top-0 left-0 h-0.5 bg-accent z-[60] transition-all duration-150 ease-out"
    :style="{ width: `${progress}%` }"
  />
</template>
