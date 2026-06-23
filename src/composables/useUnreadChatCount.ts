import { ref } from 'vue'
import { chatApi } from '@/api/chat'
import { decrementUnreadCount as subtractUnreadCount, sumUnreadCounts } from '@/utils/chatUnread'

type RoomUnreadSource = {
  unreadCount?: number | null
}

const unreadCount = ref(0)
let pollTimer: ReturnType<typeof setInterval> | undefined

function setUnreadCount(value: number) {
  unreadCount.value = Math.max(0, value)
}

function syncUnreadCountFromRooms(rooms: RoomUnreadSource[]) {
  setUnreadCount(sumUnreadCounts(rooms))
}

function incrementUnreadCount(amount = 1) {
  setUnreadCount(unreadCount.value + amount)
}

function decrementUnreadCount(amount = 1) {
  setUnreadCount(subtractUnreadCount(unreadCount.value, amount))
}

async function refreshUnreadCount() {
  try {
    const res = await chatApi.getRooms()
    syncUnreadCountFromRooms(res.data.data)
  } catch {
    setUnreadCount(0)
  }
}

function startPolling(intervalMs = 30000) {
  stopPolling({ clearCount: false })
  refreshUnreadCount()
  pollTimer = setInterval(refreshUnreadCount, intervalMs)
}

function stopPolling(options: { clearCount?: boolean } = {}) {
  clearInterval(pollTimer)
  pollTimer = undefined
  if (options.clearCount ?? true) setUnreadCount(0)
}

export function useUnreadChatCount() {
  return {
    unreadCount,
    setUnreadCount,
    syncUnreadCountFromRooms,
    incrementUnreadCount,
    decrementUnreadCount,
    refreshUnreadCount,
    startPolling,
    stopPolling,
  }
}
