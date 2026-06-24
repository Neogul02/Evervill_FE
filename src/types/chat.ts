export interface ChatParticipant {
  userId: number
  role: string
  active: boolean
  /** 백엔드 확장 예정 — 현재는 없을 수 있음 */
  nickname?: string
}

export interface ChatRoom {
  id: number
  listingId: number
  listingTitle?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
  createdAt: string
  participants?: ChatParticipant[]
}

export interface ChatMessage {
  id: number
  chatRoomId: number
  senderId: number
  content: string
  isRead: boolean
  createdAt: string
  /** 백엔드 확장 예정 — 현재는 없을 수 있음 */
  senderNickname?: string
}

export interface SendMessageRequest {
  content: string
}
