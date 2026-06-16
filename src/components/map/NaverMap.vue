<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'

const props = defineProps<{
  latitude?: number | null
  longitude?: number | null
  zoom?: number
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const hasCoords = ref(false)

// 네이버맵 SDK는 index.html에서 스크립트 로드 후 window.naver로 접근
// API 키는 환경변수 VITE_NAVER_MAP_CLIENT_ID 로 주입
declare global {
  interface Window {
    naver: any
  }
}

let map: any = null

function initMap() {
  if (!mapEl.value || !window.naver) return
  const lat = props.latitude ?? 37.5665
  const lng = props.longitude ?? 126.9780

  hasCoords.value = !!(props.latitude && props.longitude)

  map = new window.naver.maps.Map(mapEl.value, {
    center: new window.naver.maps.LatLng(lat, lng),
    zoom: props.zoom ?? 16,
    mapTypeControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: window.naver.maps.Position.TOP_RIGHT,
    },
  })

  if (hasCoords.value) {
    new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(lat, lng),
      map,
    })
  }
}

watch([() => props.latitude, () => props.longitude], ([lat, lng]) => {
  if (!map || !window.naver) return
  if (lat && lng) {
    const center = new window.naver.maps.LatLng(lat, lng)
    map.setCenter(center)
    new window.naver.maps.Marker({ position: center, map })
    hasCoords.value = true
  }
})

onMounted(() => {
  if (window.naver?.maps) {
    initMap()
  } else {
    // SDK 로드 대기 (네트워크 지연 시 fallback)
    const timer = setInterval(() => {
      if (window.naver?.maps) {
        clearInterval(timer)
        initMap()
      }
    }, 100)
    setTimeout(() => clearInterval(timer), 10000)
  }
})
</script>

<template>
  <div class="relative w-full h-full bg-canvas-soft">
    <div ref="mapEl" class="w-full h-full" />
    <div
      v-if="!latitude && !longitude"
      class="absolute inset-0 flex items-center justify-center text-ink-faint text-sm pointer-events-none"
    >
      위치 정보 없음
    </div>
  </div>
</template>
