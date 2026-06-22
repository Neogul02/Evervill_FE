import { ref, onUnmounted } from 'vue'
import { Client, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { ChatMessage } from '@/types/chat'

export function useChat() {
  const isConnected = ref(false)
  let stompClient: Client | null = null
  const subscriptions = new Map<number, StompSubscription>()

  function connect(token: string) {
    if (stompClient?.active) return
    stompClient = new Client({
      webSocketFactory: () => new SockJS(`/api/ws?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        isConnected.value = true
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
    if (!stompClient?.active) return
    subscriptions.get(roomId)?.unsubscribe()
    const sub = stompClient.subscribe(`/topic/chat/${roomId}`, (frame) => {
      onMessage(JSON.parse(frame.body) as ChatMessage)
    })
    subscriptions.set(roomId, sub)
  }

  function unsubscribeRoom(roomId: number) {
    subscriptions.get(roomId)?.unsubscribe()
    subscriptions.delete(roomId)
  }

  function disconnect() {
    subscriptions.forEach(sub => sub.unsubscribe())
    subscriptions.clear()
    stompClient?.deactivate()
    isConnected.value = false
  }

  onUnmounted(disconnect)

  return { isConnected, connect, subscribeRoom, unsubscribeRoom, disconnect }
}
