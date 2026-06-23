<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { chatApi } from '@/api/chat'
import { useChat } from '@/composables/useChat'
import { useUnreadChatCount } from '@/composables/useUnreadChatCount'
import type { ChatRoom, ChatMessage } from '@/types/chat'

const authStore = useAuthStore()
const route = useRoute()
const { isConnected, connect, subscribeRoom } = useChat()
const {
  syncUnreadCountFromRooms,
  incrementUnreadCount,
  decrementUnreadCount,
  refreshUnreadCount,
} = useUnreadChatCount()

const rooms = ref<ChatRoom[]>([])
const selectedRoom = ref<ChatRoom | null>(null)
const messages = ref<ChatMessage[]>([])
const newMessage = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const isLoadingRooms = ref(false)
const isLoadingMessages = ref(false)

async function loadRooms() {
  isLoadingRooms.value = true
  try {
    const res = await chatApi.getRooms()
    rooms.value = res.data.data
    syncUnreadCountFromRooms(rooms.value)
  } catch {
    // 빈 목록으로 처리
  } finally {
    isLoadingRooms.value = false
  }
}

function subscribeToRoom(room: ChatRoom) {
  subscribeRoom(room.id, (msg: ChatMessage) => {
    const isSelectedRoom = selectedRoom.value?.id === room.id
    const isIncomingFromOtherUser = msg.senderId !== authStore.user?.id
    const target = rooms.value.find((r) => r.id === room.id)

    if (target) {
      target.lastMessage = msg.content
      target.lastMessageAt = msg.createdAt
    }

    if (isSelectedRoom) {
      messages.value.push(msg)
      scrollToBottom()
      if (isIncomingFromOtherUser) {
        void chatApi.markAsRead(room.id).then(refreshUnreadCount).catch(() => {})
      }
      return
    }

    if (target && isIncomingFromOtherUser) {
      target.unreadCount = (target.unreadCount ?? 0) + 1
      incrementUnreadCount()
    }
  })
}
function subscribeAllRooms() {
  rooms.value.forEach(subscribeToRoom)
}

// WebSocket 연결 완료 후 전체 방 구독
watch(isConnected, (connected) => {
  if (connected && rooms.value.length > 0) {
    subscribeAllRooms()
  }
})

async function selectRoom(room: ChatRoom) {
  if (selectedRoom.value?.id === room.id) return
  selectedRoom.value = room
  messages.value = []
  isLoadingMessages.value = true

  try {
    const previousUnreadCount = room.unreadCount ?? 0
    const res = await chatApi.getMessages(room.id)
    messages.value = res.data.data
    await chatApi.markAsRead(room.id)
    room.unreadCount = 0
    decrementUnreadCount(previousUnreadCount)
  } catch {
    // 조용히 실패
  } finally {
    isLoadingMessages.value = false
  }

  scrollToBottom()
}
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

async function handleSend() {
  const content = newMessage.value.trim()
  if (!content || !selectedRoom.value) return
  newMessage.value = ''
  try {
    await chatApi.sendMessage(selectedRoom.value.id, { content })
  } catch {
    newMessage.value = content
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRoomTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const isToday = new Date().toDateString() === d.toDateString()
  return isToday
    ? d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

onMounted(async () => {
  if (authStore.token) {
    connect(authStore.token)
  }
  await loadRooms()

  // 연결이 이미 완료된 경우 (loadRooms보다 connect가 먼저 완료된 케이스)
  if (isConnected.value) {
    subscribeAllRooms()
  }

  const listingId = route.query.listingId ? Number(route.query.listingId) : null
  if (listingId) {
    try {
      const res = await chatApi.getOrCreateRoom(listingId)
      const room = res.data.data
      if (!rooms.value.find((r) => r.id === room.id)) {
        rooms.value.unshift(room)
        if (isConnected.value) {
          subscribeToRoom(room)
        }
      }
      await selectRoom(room)
    } catch (err) {
      console.error('채팅방 생성/조회 실패', err)
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-screen bg-canvas-soft dark:bg-dark-base mt-2">
    <AppHeader />

    <main
      class="flex-1 overflow-hidden pt-14 flex justify-center px-12 sm:px-16 md:px-20"
    >
      <div class="flex w-full max-w-[1600px] h-full">
        <!-- 채팅방 목록 -->
        <aside
          class="w-72 shrink-0 border-r border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface flex flex-col"
        >
          <div
            class="px-4 py-3 border-b border-hairline dark:border-dark-border shrink-0"
          >
            <h2 class="text-sm font-semibold text-ink dark:text-dark-text">
              채팅
            </h2>
          </div>

          <div
            v-if="isLoadingRooms"
            class="flex-1 flex items-center justify-center"
          >
            <div
              class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"
            />
          </div>

          <div
            v-else-if="rooms.length === 0"
            class="flex-1 flex items-center justify-center p-4"
          >
            <span
              class="text-sm text-ink-faint dark:text-dark-muted text-center"
              >채팅방이 없습니다</span
            >
          </div>

          <ul
            v-else
            class="flex-1 overflow-y-auto divide-y divide-hairline dark:divide-dark-border"
          >
            <li
              v-for="room in rooms"
              :key="room.id"
              class="px-4 py-3 cursor-pointer transition-colors"
              :class="
                selectedRoom?.id === room.id
                  ? 'bg-accent/8 dark:bg-accent/12'
                  : 'hover:bg-canvas-soft dark:hover:bg-dark-elevated'
              "
              @click="selectRoom(room)"
            >
              <div class="flex items-start justify-between gap-2">
                <p
                  class="text-sm font-medium text-ink dark:text-dark-text truncate flex-1"
                >
                  {{ room.listingTitle ?? `매물 #${room.listingId}` }}
                </p>
                <span
                  class="text-xs text-ink-faint dark:text-dark-muted shrink-0"
                >
                  {{ formatRoomTime(room.lastMessageAt) }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-0.5">
                <p
                  class="text-xs text-ink-muted dark:text-dark-muted truncate flex-1"
                >
                  {{ room.lastMessage ?? '메시지 없음' }}
                </p>
                <span
                  v-if="room.unreadCount && room.unreadCount > 0"
                  class="ml-2 shrink-0 bg-accent text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center font-medium"
                >
                  {{ room.unreadCount > 9 ? '9+' : room.unreadCount }}
                </span>
              </div>
            </li>
          </ul>
        </aside>

        <!-- 채팅 영역 -->
        <section class="flex-1 flex flex-col min-w-0">
          <template v-if="selectedRoom">
            <!-- 채팅방 헤더 -->
            <div
              class="h-12 px-4 border-b border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface flex items-center gap-3 shrink-0"
            >
              <h3
                class="text-sm font-semibold text-ink dark:text-dark-text truncate flex-1"
              >
                {{
                  selectedRoom.listingTitle ?? `매물 #${selectedRoom.listingId}`
                }}
              </h3>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="
                  isConnected
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-canvas-soft text-ink-faint dark:bg-dark-elevated dark:text-dark-muted'
                "
              >
                {{ isConnected ? '연결됨' : '연결 중...' }}
              </span>
            </div>

            <!-- 메시지 목록 -->
            <div
              ref="messagesEl"
              class="flex-1 overflow-y-auto px-4 py-4 space-y-2"
            >
              <div v-if="isLoadingMessages" class="flex justify-center py-8">
                <div
                  class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"
                />
              </div>

              <template v-else>
                <div
                  v-for="msg in messages"
                  :key="msg.id"
                  class="flex"
                  :class="
                    msg.senderId === authStore.user?.id
                      ? 'justify-end'
                      : 'justify-start'
                  "
                >
                  <div
                    class="max-w-[68%] rounded-2xl px-3.5 py-2 text-sm"
                    :class="
                      msg.senderId === authStore.user?.id
                        ? 'bg-accent text-white rounded-br-sm'
                        : 'bg-canvas dark:bg-dark-surface text-ink dark:text-dark-text rounded-bl-sm border border-hairline dark:border-dark-border'
                    "
                  >
                    <p class="leading-relaxed break-words whitespace-pre-wrap">
                      {{ msg.content }}
                    </p>
                    <p
                      class="text-[10px] mt-1 text-right leading-none"
                      :class="
                        msg.senderId === authStore.user?.id
                          ? 'text-white/60'
                          : 'text-ink-faint dark:text-dark-muted'
                      "
                    >
                      {{ formatTime(msg.createdAt) }}
                    </p>
                  </div>
                </div>
              </template>
            </div>

            <!-- 메시지 입력 -->
            <div
              class="px-4 py-3 border-t border-hairline dark:border-dark-border bg-canvas dark:bg-dark-surface shrink-0"
            >
              <form class="flex gap-2" @submit.prevent="handleSend">
                <input
                  v-model="newMessage"
                  type="text"
                  placeholder="메시지를 입력하세요"
                  class="flex-1 px-4 py-2 text-sm border border-hairline dark:border-dark-border rounded-full bg-canvas-soft dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  :disabled="!newMessage.trim()"
                  class="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-full transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  전송
                </button>
              </form>
            </div>
          </template>

          <!-- 채팅방 미선택 -->
          <div
            v-else
            class="flex-1 flex flex-col items-center justify-center gap-3 text-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-10 h-10 text-ink-faint dark:text-dark-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p class="text-sm text-ink-faint dark:text-dark-muted">
              채팅방을 선택해 대화를 시작하세요
            </p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

