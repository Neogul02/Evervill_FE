<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { UserRound } from 'lucide-vue-next'
import { listingsApi, chatApi, authApi } from '@/api'
import type { ListingOffer, ChatRoom, PublicProfile } from '@/types'
import { formatManWon } from '@/utils/format'
import { useConfirmModal } from '@/composables/useConfirmModal'

const props = defineProps<{
  roomId: number
  listingId: number
  matchedDealerName?: string | null
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  matched: [room: ChatRoom]
}>()

const offers = ref<ListingOffer[]>([])
// 제안 목록 응답엔 dealerId만 있어 신고 관리 탭과 동일한 패턴으로 프로필을 별도 조회한다
const dealerProfiles = ref<Record<number, PublicProfile>>({})
const loading = ref(false)
const error = ref(false)
const actionError = ref('')
const processingId = ref<number | null>(null)

async function fetchOffers() {
  loading.value = true
  error.value = false
  try {
    const res = await listingsApi.getOffers(props.listingId)
    offers.value = res.data.data.filter((o) => o.status === 'PENDING')
    loadDealerProfiles(offers.value.map((o) => o.dealerId))
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function loadDealerProfiles(dealerIds: number[]) {
  const uniqueIds = [...new Set(dealerIds)].filter((id) => !dealerProfiles.value[id])
  uniqueIds.forEach((id) => {
    authApi.getPublicProfile(id)
      .then((res) => { dealerProfiles.value[id] = res.data.data })
      .catch(() => {})
  })
}

function dealerName(dealerId: number) {
  return dealerProfiles.value[dealerId]?.nickname ?? `#${dealerId}`
}

async function acceptOffer(offer: ListingOffer) {
  const ok = await useConfirmModal().open({
    title: '공인중개사 매칭',
    message: `${dealerName(offer.dealerId)} 공인중개사의 제안(복비 ${formatManWon(offer.price)})을 수락하시겠습니까?`,
    confirmText: '수락하기',
  })
  if (!ok) return

  processingId.value = offer.id
  actionError.value = ''
  try {
    await chatApi.acceptOffer(props.roomId, offer.id)
    // accept 응답엔 갱신된 참가자 정보가 없어 방 목록을 다시 조회해 채팅방 상태를 갱신한다
    const roomsRes = await chatApi.getRooms()
    const room = roomsRes.data.data.find((r) => r.id === props.roomId)
    if (room) emit('matched', room)
    open.value = false
  } catch (e: any) {
    actionError.value = e.response?.data?.message ?? '수락에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    processingId.value = null
  }
}

async function cancelOffer(offer: ListingOffer) {
  const ok = await useConfirmModal().open({
    title: '제안 취소',
    message: `${dealerName(offer.dealerId)} 공인중개사의 제안을 취소하시겠습니까?`,
    confirmText: '취소하기',
    danger: true,
  })
  if (!ok) return

  processingId.value = offer.id
  actionError.value = ''
  try {
    await chatApi.cancelOffer(props.roomId, offer.id)
    offers.value = offers.value.filter((o) => o.id !== offer.id)
  } catch (e: any) {
    actionError.value = e.response?.data?.message ?? '취소에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    processingId.value = null
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
  if (!props.matchedDealerName) fetchOffers()
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
            이 매물에 복비를 제안한 공인중개사 중 한 명을 수락하면 이 채팅방에 참가해 함께 대화할 수 있어요.
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
          <p v-if="actionError" class="mx-3 mb-2 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">
            {{ actionError }}
          </p>
          <div class="flex-1 overflow-y-auto px-3 pb-3">
            <div v-if="loading" class="flex items-center justify-center py-10">
              <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>

            <div v-else-if="error" class="flex flex-col items-center gap-2 py-10 text-center text-sm text-ink-faint dark:text-dark-muted">
              <p>목록을 불러오지 못했어요.</p>
              <button type="button" class="text-accent hover:underline cursor-pointer" @click="fetchOffers">다시 시도</button>
            </div>

            <div v-else-if="offers.length === 0" class="flex flex-col items-center gap-1 py-10 text-center text-sm text-ink-faint dark:text-dark-muted">
              <p>아직 이 매물에 가격을 제안한 공인중개사가 없어요.</p>
              <p class="text-xs">잠시 후 다시 확인해주세요.</p>
            </div>

            <ul v-else class="space-y-1">
              <li v-for="offer in offers" :key="offer.id" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-canvas-soft dark:hover:bg-dark-elevated transition-colors">
                <div class="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-canvas-soft dark:bg-dark-elevated border border-hairline dark:border-dark-border flex items-center justify-center">
                  <img
                    v-if="dealerProfiles[offer.dealerId]?.profileImageUrl"
                    :src="dealerProfiles[offer.dealerId].profileImageUrl!"
                    loading="lazy"
                    decoding="async"
                    class="w-full h-full object-cover"
                  />
                  <UserRound v-else class="w-4 h-4 text-ink-faint" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-ink dark:text-dark-text truncate">{{ dealerName(offer.dealerId) }}</p>
                  <p class="text-xs text-accent font-medium truncate">복비 제안 {{ formatManWon(offer.price) }}</p>
                </div>
                <div class="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    :disabled="processingId === offer.id"
                    class="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-white hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="acceptOffer(offer)"
                  >수락</button>
                  <button
                    type="button"
                    :disabled="processingId === offer.id"
                    class="px-2.5 py-1 rounded-full text-xs font-medium border border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:border-red-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="cancelOffer(offer)"
                  >취소</button>
                </div>
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
