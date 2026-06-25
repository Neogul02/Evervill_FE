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

  // 딜러 역경매 — 제안 수락(채팅방 입장)/취소. 응답은 메시지 문자열뿐이라 참가자 갱신은 getRooms() 재조회로 처리
  acceptOffer: (roomId: number, offerId: number) =>
    client.post<ApiResponse<string>>(`/api/chat/rooms/${roomId}/offers/${offerId}/accept`, null, { headers: userIdHeader() }),

  cancelOffer: (roomId: number, offerId: number) =>
    client.post<ApiResponse<string>>(`/api/chat/rooms/${roomId}/offers/${offerId}/cancel`, null, { headers: userIdHeader() }),
}
