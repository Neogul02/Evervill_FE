import client, { userIdHeader } from './client'
import type { ApiResponse } from '@/types'
import type { ChatRoom, ChatMessage, SendMessageRequest } from '@/types/chat'

export const chatApi = {
  getRooms: () =>
    client.get<ApiResponse<ChatRoom[]>>('/api/chat/rooms', { headers: userIdHeader() }),

  getOrCreateRoom: (listingId: number) =>
    client.post<ApiResponse<ChatRoom>>('/api/chat/rooms', { listingId }, { headers: userIdHeader() }),

  getMessages: (roomId: number) =>
    client.get<ApiResponse<ChatMessage[]>>(`/api/chat/rooms/${roomId}/messages`, { headers: userIdHeader() }),

  sendMessage: (roomId: number, data: SendMessageRequest) =>
    client.post<ApiResponse<ChatMessage>>(`/api/chat/rooms/${roomId}/messages`, data, { headers: userIdHeader() }),

  markAsRead: (roomId: number) =>
    client.put<ApiResponse<void>>(`/api/chat/rooms/${roomId}/read`, undefined, { headers: userIdHeader() }),

  leaveRoom: (roomId: number) =>
    client.delete<ApiResponse<void>>(`/api/chat/rooms/${roomId}`, { headers: userIdHeader() }),
}
