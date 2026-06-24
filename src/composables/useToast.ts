import { ref } from 'vue'

export interface ToastItem {
  id: number
  title: string
  message: string
  roomId?: number
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function showToast(toast: Omit<ToastItem, 'id'>, durationMs = 4000) {
  const id = ++nextId
  toasts.value.push({ id, ...toast })
  setTimeout(() => dismissToast(id), durationMs)
}

function dismissToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return { toasts, showToast, dismissToast }
}
