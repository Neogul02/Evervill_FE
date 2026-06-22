<script setup lang="ts">
withDefaults(defineProps<{
  active?: boolean
}>(), {
  active: false,
})

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="px-3 py-1 text-xs rounded-full border font-medium transition-colors duration-150 cursor-pointer active:scale-95"
    :class="
      active
        ? 'bg-accent text-white border-accent'
        : 'bg-canvas dark:bg-dark-elevated text-ink-muted dark:text-dark-muted border-hairline dark:border-dark-border hover:border-accent hover:text-accent'
    "
    @click="$emit('click')"
  ><slot /></button>
</template>
