<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-vue-next'
import type { ListingImage } from '@/types'

const props = defineProps<{
  images: ListingImage[]
  title: string
}>()

const currentImageIndex = ref(0)
const dragStartX = ref<number | null>(null)

function prevImage() {
  const len = props.images.length
  if (!len) return
  currentImageIndex.value = (currentImageIndex.value - 1 + len) % len
}
function nextImage() {
  const len = props.images.length
  if (!len) return
  currentImageIndex.value = (currentImageIndex.value + 1) % len
}
function onImagePointerDown(e: PointerEvent) {
  dragStartX.value = e.clientX
}
function onImagePointerUp(e: PointerEvent) {
  if (dragStartX.value === null) return
  const delta = e.clientX - dragStartX.value
  dragStartX.value = null
  if (Math.abs(delta) <= 50) return
  delta > 0 ? prevImage() : nextImage()
}
</script>

<template>
  <div
    class="relative h-84 bg-canvas-soft dark:bg-dark-elevated"
    @pointerdown="onImagePointerDown"
    @pointerup="onImagePointerUp"
  >
    <template v-if="images.length">
      <img
        :src="images[currentImageIndex].imageUrl"
        :alt="title"
        class="w-full h-full object-cover cursor-grab active:cursor-grabbing"
        draggable="false"
      />
      <template v-if="images.length > 1">
        <button
          type="button"
          aria-label="이전 사진"
          @click.stop="prevImage"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="다음 사진"
          @click.stop="nextImage"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <div class="absolute bottom-3 right-3 flex gap-1">
          <button
            v-for="(_, i) in images"
            :key="i"
            @click.stop="currentImageIndex = i"
            class="w-2 h-2 rounded-full transition-colors cursor-pointer"
            :class="i === currentImageIndex ? 'bg-white' : 'bg-white/40'"
          />
        </div>
      </template>
    </template>
    <div
      v-else
      class="w-full h-full flex flex-col items-center justify-center gap-1.5 text-ink-faint dark:text-dark-muted"
    >
      <ImageOff class="w-7 h-7" />
      <span class="text-sm">이미지 없음</span>
    </div>
  </div>
</template>
