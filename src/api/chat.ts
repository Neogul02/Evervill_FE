import client from './client'
import type { ApiResponse } from '@/types'
import type { ChatRoom, ChatMessage, SendMessageRequest } from '@/types/chat'

export const chatApi = {
  getRooms: () =>
    client.get<ApiResponse<ChatRoom[]>>('/api/chat/rooms'),

  getOrCreateRoom: (listingId: number) =>
    client.post<ApiResponse<ChatRoom>>('/api/chat/rooms', { listingId }),

  getMessages: (roomId: number) =>
    client.get<ApiResponse<ChatMessage[]>>(`/api/chat/rooms/${roomId}/messages`),

  sendMessage: (roomId: number, data: SendMessageRequest) =>
    client.post<ApiResponse<ChatMessage>>(`/api/chat/rooms/${roomId}/messages`, data),

  markAsRead: (roomId: number) =>
    client.put<ApiResponse<void>>(`/api/chat/rooms/${roomId}/read`),
}
