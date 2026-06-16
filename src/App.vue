<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'

const { init } = useTheme()
init()
</script>

<template>
  <RouterView />
</template>
