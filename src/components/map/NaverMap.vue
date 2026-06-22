<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { geocodeAddress } from '@/utils/geocode'

const props = defineProps<{
  latitude?: number | null
  longitude?: number | null
  zoom?: number
  address?: string | null
}>()

const mapEl = ref<HTMLDivElement | null>(null)
const hasCoords = ref(false)
const geocoding = ref(false)
const geocodeFailed = ref(false)

// 네이버맵 SDK는 index.html에서 스크립트 로드 후 window.naver로 접근
// API 키는 환경변수 VITE_NAVER_MAP_CLIENT_ID 로 주입
declare global {
  interface Window {
    naver: any
  }
}

let map: any = null

function placeMarker(lat: number, lng: number, center = true) {
  if (!map) return
  const position = new window.naver.maps.LatLng(lat, lng)
  if (center) map.setCenter(position)
  new window.naver.maps.Marker({ position, map })
  hasCoords.value = true
}

function createMap(lat: number, lng: number) {
  if (!mapEl.value || !window.naver) return
  map = new window.naver.maps.Map(mapEl.value, {
    center: new window.naver.maps.LatLng(lat, lng),
    zoom: props.zoom ?? 16,
    mapTypeControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: window.naver.maps.Position.TOP_RIGHT,
    },
  })
}

async function initMap() {
  if (!mapEl.value || !window.naver) return

  if (props.latitude && props.longitude) {
    createMap(props.latitude, props.longitude)
    placeMarker(props.latitude, props.longitude, false)
    return
  }

  // 좌표가 없으면 주소 기반 지오코딩으로 대체
  createMap(37.5665, 126.978)
  if (props.address) {
    geocoding.value = true
    const result = await geocodeAddress(props.address)
    geocoding.value = false
    if (result) {
      placeMarker(result.lat, result.lng)
    } else {
      geocodeFailed.value = true
    }
  }
}

watch([() => props.latitude, () => props.longitude, () => props.address], async ([lat, lng, address]) => {
  if (!map || !window.naver) return
  if (lat && lng) {
    placeMarker(lat, lng)
    geocodeFailed.value = false
    return
  }
  if (address) {
    geocoding.value = true
    geocodeFailed.value = false
    const result = await geocodeAddress(address)
    geocoding.value = false
    if (result) placeMarker(result.lat, result.lng)
    else geocodeFailed.value = true
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
      v-if="geocoding"
      class="absolute inset-0 flex items-center justify-center text-ink-faint text-sm pointer-events-none bg-canvas-soft/70"
    >
      위치 검색 중...
    </div>
    <div
      v-else-if="!hasCoords && (geocodeFailed || (!address && !latitude && !longitude))"
      class="absolute inset-0 flex items-center justify-center text-ink-faint text-sm pointer-events-none"
    >
      위치 정보 없음
    </div>
  </div>
</template>
