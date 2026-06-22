<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'utility'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
})

const VARIANT_CLASS: Record<string, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-white border-accent rounded-full shadow-sm',
  secondary: 'border border-accent text-accent hover:bg-accent-light dark:hover:bg-accent-dark-muted rounded-full',
  utility: 'bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text border border-hairline dark:border-dark-border rounded-[8px] hover:border-accent hover:text-accent',
}

const SIZE_CLASS: Record<string, string> = {
  sm: 'text-xs px-3 py-1',
  md: 'text-sm px-4 py-1.5',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
    :class="[VARIANT_CLASS[variant], SIZE_CLASS[size]]"
  ><slot /></button>
</template>
