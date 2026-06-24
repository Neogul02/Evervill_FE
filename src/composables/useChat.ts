import { ref } from 'vue'
import { Client, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { chatApi } from '@/api/chat'
import type { ChatMessage } from '@/types/chat'
import { useUnreadChatCount } from './useUnreadChatCount'
import { useToast } from './useToast'

// 모든 컴포넌트가 공유하는 단일 연결 상태 (앱 전역에서 한 번만 connect/disconnect)
const isConnected = ref(false)
let stompClient: Client | null = null
const subscriptions = new Map<number, StompSubscription>()
const messageListeners = new Set<(msg: ChatMessage) => void>()
const activeRoomId = ref<number | null>(null)
let currentUserId: number | null = null

function setActiveRoom(roomId: number | null) {
  activeRoomId.value = roomId
}

function onMessage(cb: (msg: ChatMessage) => void) {
  messageListeners.add(cb)
  return () => messageListeners.delete(cb)
}

function handleIncomingMessage(msg: ChatMessage) {
  messageListeners.forEach((cb) => cb(msg))
  if (msg.senderId === currentUserId) return
  if (activeRoomId.value === msg.chatRoomId) return

  const { incrementUnreadCount } = useUnreadChatCount()
  incrementUnreadCount()

  const { showToast } = useToast()
  showToast({
    title: msg.senderNickname ?? '새 메시지',
    message: msg.content,
    roomId: msg.chatRoomId,
  })
}

function subscribeRoom(roomId: number) {
  if (!stompClient?.active || subscriptions.has(roomId)) return
  const sub = stompClient.subscribe(`/topic/chat/${roomId}`, (frame) => {
    handleIncomingMessage(JSON.parse(frame.body) as ChatMessage)
  })
  subscriptions.set(roomId, sub)
}

function unsubscribeRoom(roomId: number) {
  subscriptions.get(roomId)?.unsubscribe()
  subscriptions.delete(roomId)
}

async function subscribeAllRooms() {
  try {
    const res = await chatApi.getRooms()
    res.data.data.forEach((room) => subscribeRoom(room.id))
  } catch {}
}

function connect(token: string, userId: number) {
  currentUserId = userId
  if (stompClient?.active) return
  stompClient = new Client({
    webSocketFactory: () => new SockJS(`/api/ws?token=${token}`),
    reconnectDelay: 5000,
    onConnect: () => {
      isConnected.value = true
      void subscribeAllRooms()
    },
    onDisconnect: () => {
      isConnected.value = false
    },
    onStompError: (frame) => {
      console.error('STOMP error', frame.headers['message'])
    },
  })
  stompClient.activate()
}

function disconnect() {
  subscriptions.forEach((sub) => sub.unsubscribe())
  subscriptions.clear()
  stompClient?.deactivate()
  stompClient = null
  isConnected.value = false
  currentUserId = null
  activeRoomId.value = null
}

export function useChat() {
  return {
    isConnected,
    connect,
    disconnect,
    subscribeRoom,
    unsubscribeRoom,
    setActiveRoom,
    onMessage,
  }
}
