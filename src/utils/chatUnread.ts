type UnreadSource = {
  unreadCount?: number | null
}

export function clampUnreadCount(value: number) {
  return Math.max(0, value)
}

export function sumUnreadCounts(items: UnreadSource[]) {
  return items.reduce((sum, item) => sum + clampUnreadCount(item.unreadCount ?? 0), 0)
}

export function decrementUnreadCount(current: number, amount: number) {
  return clampUnreadCount(current - clampUnreadCount(amount))
}

export function nextUnreadCountForIncomingMessage(current: number, isSelectedRoom: boolean) {
  return isSelectedRoom ? clampUnreadCount(current) : clampUnreadCount(current + 1)
}
