export interface ChatRoom {
  id: number
  listingId: number
  buyerId: number
  sellerId: number
  listingTitle?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
  createdAt: string
}

export interface ChatMessage {
  id: number
  chatRoomId: number
  senderId: number
  content: string
  isRead: boolean
  createdAt: string
}

export interface SendMessageRequest {
  content: string
}
