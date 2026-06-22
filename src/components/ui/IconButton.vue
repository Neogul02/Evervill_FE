<script setup lang="ts">
withDefaults(defineProps<{
  ariaLabel?: string
  shape?: 'circle' | 'square'
}>(), {
  shape: 'circle',
})

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    :aria-label="ariaLabel"
    class="w-9 h-9 inline-flex items-center justify-center text-ink-faint dark:text-dark-muted hover:bg-canvas-soft dark:hover:bg-dark-elevated hover:text-ink dark:hover:text-dark-text transition-colors duration-150 cursor-pointer active:scale-90"
    :class="shape === 'circle' ? 'rounded-full' : 'rounded-[8px]'"
    @click="$emit('click')"
  ><slot /></button>
</template>
