<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listingsApi } from '@/api'
import { useAuthStore } from '@/stores'
import type { DealType, Listing } from '@/types'
import { clampNumber } from '@/utils/validation'
import AppHeader from '@/components/layout/AppHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const id = Number(route.params.id)

const form = ref({
  title: '',
  description: '',
  dealType: 'SALE' as DealType,
  price: '',
  monthlyRent: '',
  area: '',
  floor: '',
  address: '',
  addressDetail: '',
})

const existingImages = ref<{ id: number; imageUrl: string; sortOrder: number }[]>([])
const newImages = ref<File[]>([])
const newImagePreviewUrls = ref<string[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

async function fetchListing() {
  try {
    const res = await listingsApi.getById(id)
    const listing: Listing = res.data.data

    if (authStore.user && listing.sellerId !== authStore.user.id) {
      router.replace(`/listings/${id}`)
      return
    }

    form.value = {
      title: listing.title,
      description: listing.description ?? '',
      dealType: listing.dealType,
      price: String(listing.price ?? ''),
      monthlyRent: String(listing.monthlyRent ?? ''),
      area: String(listing.area ?? ''),
      floor: String(listing.floor ?? ''),
      address: listing.address,
      addressDetail: listing.addressDetail ?? '',
    }
    existingImages.value = listing.images ?? []
  } catch {
    error.value = '매물 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function removeExistingImage(imageId: number) {
  try {
    await listingsApi.deleteImage(id, imageId)
    existingImages.value = existingImages.value.filter(img => img.id !== imageId)
  } catch {
    alert('이미지 삭제에 실패했습니다.')
  }
}

function handleImageSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const remaining = 5 - existingImages.value.length - newImages.value.length
  for (const file of Array.from(files)) {
    if (newImages.value.length >= remaining) break
    newImages.value.push(file)
    newImagePreviewUrls.value.push(URL.createObjectURL(file))
  }
}

function removeNewImage(index: number) {
  URL.revokeObjectURL(newImagePreviewUrls.value[index])
  newImages.value.splice(index, 1)
  newImagePreviewUrls.value.splice(index, 1)
}

async function onSubmit() {
  if (!form.value.title || !form.value.address || !form.value.price) {
    error.value = '제목, 주소, 가격은 필수 항목입니다.'
    return
  }
  const price = Number(form.value.price)
  const monthlyRent = form.value.monthlyRent ? Number(form.value.monthlyRent) : undefined
  const area = form.value.area ? Number(form.value.area) : undefined
  const floor = form.value.floor ? Number(form.value.floor) : undefined
  if (!Number.isFinite(price) || price < 0 || price > 2000000000) {
    error.value = '가격은 0 이상 2,000,000,000 이하로 입력해주세요.'
    return
  }
  if (monthlyRent !== undefined && (!Number.isFinite(monthlyRent) || monthlyRent < 0 || monthlyRent > 2000000000)) {
    error.value = '월세는 0 이상 2,000,000,000 이하로 입력해주세요.'
    return
  }
  if (area !== undefined && (!Number.isFinite(area) || area < 0 || area > 100000)) {
    error.value = '면적은 0 이상 100,000 이하로 입력해주세요.'
    return
  }
  if (floor !== undefined && (!Number.isFinite(floor) || floor < -10 || floor > 200)) {
    error.value = '층수는 -10 이상 200 이하로 입력해주세요.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await listingsApi.update(id, {
      title: form.value.title,
      description: form.value.description || undefined,
      dealType: form.value.dealType,
      price: clampNumber(price, 0, 2000000000),
      monthlyRent: monthlyRent !== undefined ? clampNumber(monthlyRent, 0, 2000000000) : undefined,
      area: area !== undefined ? clampNumber(area, 0, 100000) : undefined,
      floor: floor !== undefined ? clampNumber(floor, -10, 200) : undefined,
      address: form.value.address,
      addressDetail: form.value.addressDetail || undefined,
    })

    const startOrder = existingImages.value.length
    for (let i = 0; i < newImages.value.length; i++) {
      await listingsApi.uploadImage(id, newImages.value[i], startOrder + i)
    }

    router.push(`/listings/${id}`)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? '수정에 실패했습니다.'
  } finally {
    saving.value = false
  }
}

onMounted(fetchListing)
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />

    <main class="flex-1 max-w-2xl mx-auto w-full px-4 pt-14 pb-8">
      <div class="py-6">
        <button @click="router.back()" class="text-sm text-ink-muted dark:text-dark-muted hover:text-accent flex items-center gap-1 cursor-pointer">
          ← 뒤로
        </button>
        <h1 class="text-xl font-bold text-ink dark:text-dark-text mt-2 tracking-tight">매물 수정</h1>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>

      <form v-else class="space-y-3" @submit.prevent="onSubmit">

        <!-- 거래 유형 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5">
          <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-3">거래 유형 *</label>
          <div class="flex gap-2">
            <button
              v-for="type in [['SALE','매매'],['JEONSE','전세'],['MONTHLY_RENT','월세']]"
              :key="type[0]"
              type="button"
              @click="form.dealType = type[0] as DealType"
              class="flex-1 py-2 rounded-full text-sm font-semibold border transition-colors cursor-pointer"
              :class="form.dealType === type[0]
                ? 'bg-accent text-white border-accent'
                : 'border-hairline dark:border-dark-border text-ink-muted dark:text-dark-muted hover:border-accent'"
            >{{ type[1] }}</button>
          </div>
        </div>

        <!-- 기본 정보 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">제목 *</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="매물 제목을 입력하세요"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">
              {{ form.dealType === 'MONTHLY_RENT' ? '보증금 (만원) *' : '가격 (만원) *' }}
            </label>
            <input
              v-model="form.price"
              type="number"
              min="0"
              max="2000000000"
              placeholder="만원 단위로 입력"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div v-if="form.dealType === 'MONTHLY_RENT'">
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">월세 (만원)</label>
            <input
              v-model="form.monthlyRent"
              type="number"
              min="0"
              max="2000000000"
              placeholder="월세 금액"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">면적 (m²)</label>
              <input
                v-model="form.area"
                type="number"
                step="0.01"
                min="0"
                max="100000"
                placeholder="예: 33.5"
                class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">층수</label>
              <input
                v-model="form.floor"
                type="number"
                min="-10"
                max="200"
                placeholder="예: 3"
                class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <!-- 위치 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">주소 *</label>
            <input
              v-model="form.address"
              type="text"
              placeholder="도로명 또는 지번 주소"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">상세 주소</label>
            <input
              v-model="form.addressDetail"
              type="text"
              placeholder="동/호수 등"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <!-- 설명 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5">
          <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">매물 설명</label>
          <textarea
            v-model="form.description"
            rows="5"
            maxlength="2000"
            placeholder="매물에 대한 상세 설명을 입력하세요"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <!-- 이미지 관리 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5">
          <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-3">
            사진 (최대 5장, 현재 {{ existingImages.length + newImages.length }}장)
          </label>
          <div class="flex flex-wrap gap-3">
            <!-- 기존 이미지 -->
            <div
              v-for="img in existingImages"
              :key="img.id"
              class="relative w-20 h-20 rounded-lg overflow-hidden border border-hairline dark:border-dark-border"
            >
              <img :src="img.imageUrl" class="w-full h-full object-cover" />
              <button
                type="button"
                @click="removeExistingImage(img.id)"
                class="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center cursor-pointer"
              >×</button>
            </div>
            <!-- 새 이미지 -->
            <div
              v-for="(url, i) in newImagePreviewUrls"
              :key="`new-${i}`"
              class="relative w-20 h-20 rounded-lg overflow-hidden border border-accent/40"
            >
              <img :src="url" class="w-full h-full object-cover" />
              <button
                type="button"
                @click="removeNewImage(i)"
                class="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center cursor-pointer"
              >×</button>
            </div>
            <!-- 추가 버튼 -->
            <label
              v-if="existingImages.length + newImages.length < 5"
              class="w-20 h-20 rounded-lg border-2 border-dashed border-hairline dark:border-dark-border flex items-center justify-center cursor-pointer hover:border-accent transition-colors"
            >
              <span class="text-2xl text-ink-faint dark:text-dark-muted">+</span>
              <input type="file" accept="image/*" multiple class="hidden" @change="handleImageSelect" />
            </label>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded">
          {{ error }}
        </p>

        <BaseButton type="submit" :disabled="saving" class="w-full">
          {{ saving ? '저장 중...' : '수정 완료' }}
        </BaseButton>
      </form>
    </main>
  </div>
</template>
