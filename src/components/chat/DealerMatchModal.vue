<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { UserRound } from 'lucide-vue-next'
import { dealerApi, chatApi } from '@/api'
import type { Dealer, ChatRoom } from '@/types'
import { useConfirmModal } from '@/composables/useConfirmModal'

const props = defineProps<{
  roomId: number
  matchedDealerName?: string | null
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  matched: [room: ChatRoom]
}>()

const dealers = ref<Dealer[]>([])
const loading = ref(false)
const error = ref(false)
const matching = ref(false)

async function fetchDealers() {
  loading.value = true
  error.value = false
  try {
    const res = await dealerApi.getApprovedDealers()
    dealers.value = res.data.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function selectDealer(dealer: Dealer) {
  const ok = await useConfirmModal().open({
    title: '공인중개사 매칭',
    message: `${dealer.nickname} 공인중개사를 이 채팅방에 매칭하시겠습니까?`,
    confirmText: '매칭하기',
  })
  if (!ok) return

  matching.value = true
  try {
    const res = await chatApi.addDealerParticipant(props.roomId, dealer.id)
    emit('matched', res.data.data)
    open.value = false
  } catch (e: any) {
    error.value = true
  } finally {
    matching.value = false
  }
}

const backdropReady = ref(false)
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  setTimeout(() => { backdropReady.value = true }, 150)
  if (!props.matchedDealerName) fetchDealers()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
function onBackdropClick() {
  if (backdropReady.value) open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="공인중개사 매칭"
    >
      <div class="absolute inset-0 bg-black/55" @click="onBackdropClick" @touchend.prevent="onBackdropClick" />

      <div class="modal-panel relative w-full max-w-sm rounded-2xl bg-canvas dark:bg-dark-surface border border-hairline dark:border-dark-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div class="h-1 w-full bg-accent shrink-0" />

        <div class="px-6 pt-5 pb-3 shrink-0">
          <h2 class="text-base font-bold text-ink dark:text-dark-text tracking-tight">공인중개사 매칭</h2>
          <p class="text-sm text-ink-muted dark:text-dark-muted mt-1 leading-relaxed">
            매칭하면 선택한 공인중개사가 이 채팅방에 참가해 함께 대화할 수 있어요.
          </p>
        </div>

        <!-- 이미 매칭된 경우 -->
        <div v-if="matchedDealerName" class="px-6 pb-6">
          <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-canvas-soft dark:bg-dark-elevated text-sm text-ink-muted dark:text-dark-muted">
            <UserRound class="w-4 h-4 shrink-0 text-accent" />
            이미 <span class="font-medium text-ink dark:text-dark-text">{{ matchedDealerName }}</span> 공인중개사가 매칭되어 있어요.
          </div>
        </div>

        <!-- 목록 -->
        <template v-else>
          <div class="flex-1 overflow-y-auto px-3 pb-3">
            <div v-if="loading" class="flex items-center justify-center py-10">
              <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>

            <div v-else-if="error" class="flex flex-col items-center gap-2 py-10 text-center text-sm text-ink-faint dark:text-dark-muted">
              <p>목록을 불러오지 못했어요.</p>
              <button type="button" class="text-accent hover:underline cursor-pointer" @click="fetchDealers">다시 시도</button>
            </div>

            <div v-else-if="dealers.length === 0" class="flex flex-col items-center gap-1 py-10 text-center text-sm text-ink-faint dark:text-dark-muted">
              <p>활동 중인 공인중개사가 없어요.</p>
              <p class="text-xs">잠시 후 다시 확인해주세요.</p>
            </div>

            <ul v-else class="space-y-1">
              <li v-for="dealer in dealers" :key="dealer.id">
                <button
                  type="button"
                  :disabled="matching"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  @click="selectDealer(dealer)"
                >
                  <div class="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-canvas-soft dark:bg-dark-elevated border border-hairline dark:border-dark-border flex items-center justify-center">
                    <img
                      v-if="dealer.profileImageUrl"
                      :src="dealer.profileImageUrl"
                      loading="lazy"
                      decoding="async"
                      class="w-full h-full object-cover"
                    />
                    <UserRound v-else class="w-4 h-4 text-ink-faint" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-ink dark:text-dark-text truncate">{{ dealer.nickname }} · {{ dealer.businessName }}</p>
                    <p class="text-xs text-ink-faint dark:text-dark-muted truncate">{{ dealer.officeAddress }}</p>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </template>

        <div class="px-6 py-4 border-t border-hairline dark:border-dark-border shrink-0">
          <button
            type="button"
            class="w-full py-2 text-sm font-medium text-ink-muted dark:text-dark-muted hover:text-ink dark:hover:text-dark-text transition-colors cursor-pointer"
            @click="open = false"
          >닫기</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-panel {
  animation: modal-pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
