<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { listingsApi } from '@/api'
import type { DealType } from '@/types'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()

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

const images = ref<File[]>([])
const imagePreviewUrls = ref<string[]>([])
const loading = ref(false)
const error = ref('')

function handleImageSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    if (images.value.length >= 5) break
    images.value.push(file)
    imagePreviewUrls.value.push(URL.createObjectURL(file))
  }
}

function removeImage(index: number) {
  URL.revokeObjectURL(imagePreviewUrls.value[index])
  images.value.splice(index, 1)
  imagePreviewUrls.value.splice(index, 1)
}

async function onSubmit() {
  if (!form.value.title || !form.value.address || !form.value.price) {
    error.value = '제목, 주소, 가격은 필수 항목입니다.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await listingsApi.create({
      title: form.value.title,
      description: form.value.description || undefined,
      dealType: form.value.dealType,
      price: Number(form.value.price),
      monthlyRent: form.value.monthlyRent ? Number(form.value.monthlyRent) : undefined,
      area: form.value.area ? Number(form.value.area) : undefined,
      floor: form.value.floor ? Number(form.value.floor) : undefined,
      address: form.value.address,
      addressDetail: form.value.addressDetail || undefined,
    })

    const listingId = res.data.data.id
    for (let i = 0; i < images.value.length; i++) {
      await listingsApi.uploadImage(listingId, images.value[i], i)
    }

    router.push(`/listings/${listingId}`)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? '매물 등록에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-canvas-soft dark:bg-dark-base">
    <AppHeader />

    <main class="flex-1 max-w-2xl mx-auto w-full px-4 pt-14 pb-8">
      <div class="py-6">
        <button @click="router.back()" class="text-sm text-ink-muted dark:text-dark-muted hover:text-accent flex items-center gap-1 cursor-pointer">
          ← 뒤로
        </button>
        <h1 class="text-xl font-bold text-ink dark:text-dark-text mt-2 tracking-tight">매물 등록</h1>
      </div>

      <form class="space-y-3" @submit.prevent="onSubmit">

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
              placeholder="만원 단위로 입력"
              class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div v-if="form.dealType === 'MONTHLY_RENT'">
            <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">월세 (만원)</label>
            <input
              v-model="form.monthlyRent"
              type="number"
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
                placeholder="예: 33.5"
                class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-1.5">층수</label>
              <input
                v-model="form.floor"
                type="number"
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
            placeholder="매물에 대한 상세 설명을 입력하세요"
            class="w-full px-3 py-2 border border-hairline dark:border-dark-border rounded text-sm bg-canvas dark:bg-dark-elevated text-ink dark:text-dark-text placeholder-ink-faint dark:placeholder-dark-muted focus:outline-none focus:border-accent resize-none"
          />
        </div>

        <!-- 이미지 업로드 -->
        <div class="bg-canvas dark:bg-dark-surface rounded-xl border border-hairline dark:border-dark-border p-5">
          <label class="block text-sm font-medium text-ink-secondary dark:text-dark-text mb-3">사진 (최대 5장)</label>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="(url, i) in imagePreviewUrls"
              :key="i"
              class="relative w-20 h-20 rounded-lg overflow-hidden border border-hairline dark:border-dark-border"
            >
              <img :src="url" class="w-full h-full object-cover" />
              <button
                type="button"
                @click="removeImage(i)"
                class="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
              >×</button>
            </div>
            <label
              v-if="images.length < 5"
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

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded-full text-sm font-medium disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
        >
          {{ loading ? '등록 중...' : '매물 등록하기' }}
        </button>
      </form>
    </main>
  </div>
</template>
