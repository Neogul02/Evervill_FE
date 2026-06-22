import { ref } from 'vue'
import { chatApi } from '@/api/chat'

const unreadCount = ref(0)
let pollTimer: ReturnType<typeof setInterval> | undefined

async function refreshUnreadCount() {
  try {
    const res = await chatApi.getRooms()
    unreadCount.value = res.data.data.reduce((sum, room) => sum + (room.unreadCount ?? 0), 0)
  } catch {
    unreadCount.value = 0
  }
}

function startPolling(intervalMs = 30000) {
  refreshUnreadCount()
  stopPolling()
  pollTimer = setInterval(refreshUnreadCount, intervalMs)
}

function stopPolling() {
  clearInterval(pollTimer)
  pollTimer = undefined
  unreadCount.value = 0
}

export function useUnreadChatCount() {
  return { unreadCount, refreshUnreadCount, startPolling, stopPolling }
}
