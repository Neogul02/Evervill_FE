<script setup lang="ts">
import type { BadgeTone } from '@/constants/dealTypeColors'

withDefaults(defineProps<{
  tone?: BadgeTone
}>(), {
  tone: 'neutral',
})

const TONE_CLASS: Record<BadgeTone, string> = {
  green: 'bg-accent-light text-accent-hover dark:bg-accent-dark-muted dark:text-accent',
  sky: 'bg-accent-sky-light text-accent-sky dark:bg-accent-sky-dark dark:text-accent-sky',
  amber: 'bg-accent-amber-light text-accent-amber dark:bg-accent-amber-dark dark:text-accent-amber',
  rose: 'bg-accent-rose-light text-accent-rose dark:bg-accent-rose-dark dark:text-accent-rose',
  violet: 'bg-accent-violet-light text-accent-violet dark:bg-accent-violet-dark dark:text-accent-violet',
  neutral: 'bg-canvas-soft text-ink-muted dark:bg-dark-elevated dark:text-dark-muted',
}
</script>

<template>
  <span
    class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
    :class="TONE_CLASS[tone]"
  ><slot /></span>
</template>
