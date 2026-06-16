import { ref, onUnmounted } from 'vue'
import { Client, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { ChatMessage } from '@/types/chat'

export function useChat() {
  const isConnected = ref(false)
  let stompClient: Client | null = null
  let subscription: StompSubscription | null = null
  let pendingRoomId: number | null = null
  let pendingCallback: ((msg: ChatMessage) => void) | null = null

  function doSubscribe(roomId: number, onMessage: (msg: ChatMessage) => void) {
    subscription?.unsubscribe()
    subscription = stompClient!.subscribe(`/topic/chat/${roomId}`, (frame) => {
      onMessage(JSON.parse(frame.body) as ChatMessage)
    })
  }

  function connect(token: string) {
    if (stompClient?.active) return
    stompClient = new Client({
      webSocketFactory: () => new SockJS(`/api/ws?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        isConnected.value = true
        if (pendingRoomId !== null && pendingCallback !== null) {
          doSubscribe(pendingRoomId, pendingCallback)
          pendingRoomId = null
          pendingCallback = null
        }
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

  function subscribeRoom(roomId: number, onMessage: (msg: ChatMessage) => void) {
    if (isConnected.value && stompClient) {
      doSubscribe(roomId, onMessage)
    } else {
      pendingRoomId = roomId
      pendingCallback = onMessage
    }
  }

  function disconnect() {
    subscription?.unsubscribe()
    stompClient?.deactivate()
    isConnected.value = false
  }

  onUnmounted(disconnect)

  return { isConnected, connect, subscribeRoom, disconnect }
}
