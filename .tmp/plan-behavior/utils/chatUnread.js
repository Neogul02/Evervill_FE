export function clampUnreadCount(value) {
    return Math.max(0, value);
}
export function sumUnreadCounts(items) {
    return items.reduce((sum, item) => sum + clampUnreadCount(item.unreadCount ?? 0), 0);
}
export function decrementUnreadCount(current, amount) {
    return clampUnreadCount(current - clampUnreadCount(amount));
}
export function nextUnreadCountForIncomingMessage(current, isSelectedRoom) {
    return isSelectedRoom ? clampUnreadCount(current) : clampUnreadCount(current + 1);
}
