<script setup lang="ts">
import { useRouter } from 'vue-router'
import { MessageCircle, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { toasts, dismissToast } = useToast()

function goToRoom(roomId: number | undefined, id: number) {
  dismissToast(id)
  if (roomId) router.push({ path: '/chat', query: { roomId: String(roomId) } })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-16 right-4 z-[100] flex flex-col gap-2 w-80">
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-4"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border rounded-xl shadow-lg p-3.5 flex gap-2.5 cursor-pointer hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors"
          @click="goToRoom(toast.roomId, toast.id)"
        >
          <div class="shrink-0 w-8 h-8 rounded-full bg-accent-light dark:bg-accent-dark-muted flex items-center justify-center text-accent">
            <MessageCircle class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-ink dark:text-dark-text truncate">{{ toast.title }}</p>
            <p class="text-xs text-ink-muted dark:text-dark-muted truncate">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            class="shrink-0 text-ink-faint dark:text-dark-muted hover:text-ink dark:hover:text-dark-text cursor-pointer"
            @click.stop="dismissToast(toast.id)"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
