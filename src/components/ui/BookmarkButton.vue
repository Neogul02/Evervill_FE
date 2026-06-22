<script setup lang="ts">
import { Bookmark, BookmarkCheck } from 'lucide-vue-next'

withDefaults(defineProps<{
  bookmarked?: boolean
}>(), {
  bookmarked: false,
})

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full border transition-colors duration-150 cursor-pointer active:scale-95"
    :class="
      bookmarked
        ? 'bg-accent-light dark:bg-accent-dark-muted border-accent text-accent'
        : 'border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:border-accent hover:text-accent hover:bg-accent-light dark:hover:bg-accent-dark-muted'
    "
    @click="$emit('click')"
  >
    <BookmarkCheck v-if="bookmarked" class="w-4 h-4" />
    <Bookmark v-else class="w-4 h-4" />
    {{ bookmarked ? '저장됨' : '북마크' }}
  </button>
</template>
