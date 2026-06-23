# 디자인 수정사항: 네비게이션 드래그 방지 / 스크롤바 숨김 / 상세페이지 사진 캐러셀

**Status:** pending approval
**Mode:** Direct plan (no consensus loop)

## Requirements Summary

1. nav 바에서 마우스로 드래그했을 때 텍스트/이미지가 선택되거나 끌리는 현상을 막는다.
2. 매물탭, 실거래가탭의 리스트/상세 패널에서 스크롤은 그대로 동작하되 스크롤바만 시각적으로 숨긴다.
3. 매물 상세페이지(`ListingDetailPanel`)에서 사진이 여러 장일 때 마우스 드래그(스와이프) 또는 좌우 화살표 버튼으로 사진을 넘길 수 있게 한다.

## Current State (codebase facts)

- **Nav bar**: [AppHeader.vue:46](src/components/layout/AppHeader.vue:46) 컨테이너 안에 로고 이미지([AppHeader.vue](src/components/layout/AppHeader.vue)) + 좌측 링크(매물/실거래가/공지사항) + 우측 데스크톱 nav(`<nav class="flex items-center gap-0.5 shrink-0 relative">`, 91~147행) + 모바일 드롭다운(177~230행)이 있다. 별도의 `overflow-x-auto` 스크롤 영역은 없고, 현재 문제는 마우스를 누른 채 드래그하면 브라우저 기본 동작으로 텍스트가 파랗게 선택되거나 로고 `<img>`가 드래그 고스트로 끌리는 것이다. `select-none`/`draggable="false"` 같은 방지 처리가 전혀 없다.
- **스크롤바**: 아래 4개 컨테이너가 세로 스크롤을 갖고 있고 전부 기본 브라우저 스크롤바가 보인다.
  - [ListingListPanel.vue:95](src/components/listing/ListingListPanel.vue:95) `<div class="flex-1 overflow-y-auto">`
  - [ListingDetailPanel.vue:108](src/components/listing/ListingDetailPanel.vue:108) `<div class="h-full overflow-y-auto ...">`
  - [MarketListPanel.vue:89](src/components/market/MarketListPanel.vue:89) `<div class="flex-1 overflow-y-auto">`
  - [MarketDetailPanel.vue:86](src/components/market/MarketDetailPanel.vue:86) `<div class="h-full flex flex-col overflow-y-auto ...">`
  - [style.css](src/style.css)에 `::-webkit-scrollbar`/`scrollbar-width` 커스텀 규칙이나 scrollbar-hide 플러그인이 전혀 없음 (Tailwind v4, `@tailwindcss/vite`만 사용, `tailwind.config.ts` 자체가 없음).
- **사진 갤러리**: [ListingDetailPanel.vue:127-147](src/components/listing/ListingDetailPanel.vue:127)에 `currentImageIndex` ref([ListingDetailPanel.vue:53](src/components/listing/ListingDetailPanel.vue:53))로 현재 이미지를 추적하는 단일 `<img>` + 하단 닷 인디케이터(클릭으로 점프)만 존재. 드래그/스와이프, 좌우 화살표 버튼 없음. `MarketDetailPanel.vue`는 `MarketProperty` 타입에 이미지 필드가 없어 이미지 갤러리 자체가 없음 → 이 항목은 `ListingDetailPanel`에만 적용.
- **의존성**: `lucide-vue-next`(아이콘), `@vueuse/core`(유틸 컴포저블) 이미 설치되어 있음. 캐러셀 전용 라이브러리(Swiper, Embla 등)는 없음 → 새 라이브러리 설치 없이 네이티브 Pointer Events로 구현.

## Acceptance Criteria

1. **Nav 드래그 방지**
   - AppHeader의 좌측 로고+링크 영역, 우측 데스크톱 nav, 모바일 드롭다운에 `select-none`이 적용되어, 마우스로 눌러서 드래그해도 텍스트가 파랗게 선택되지 않는다.
   - 로고 `<img>`에 `draggable="false"`가 적용되어 이미지를 끌어도 드래그 고스트가 생기지 않는다.
   - 단, 검색 입력창(`<input>`, [AppHeader.vue:78-86](src/components/layout/AppHeader.vue:78))과 RouterLink 클릭 동작은 영향받지 않아야 한다 (`select-none`은 입력창에는 적용하지 않음).

2. **스크롤바 숨김**
   - `src/style.css`에 `.scrollbar-hide` 유틸리티 클래스를 추가한다 (`scrollbar-width: none`, `-ms-overflow-style: none`, `&::-webkit-scrollbar { display: none }`).
   - 위 4개 컨테이너(ListingListPanel, ListingDetailPanel, MarketListPanel, MarketDetailPanel)에 `.scrollbar-hide` 클래스를 추가한다.
   - 스크롤바는 안 보이지만 마우스 휠/터치 스크롤 동작은 기존과 동일하게 유지된다 (`overflow-y-auto`는 그대로 유지).

3. **상세페이지 사진 캐러셀**
   - `detail.images.length > 1`일 때 이미지 좌/우에 `ChevronLeft`/`ChevronRight` 아이콘 버튼이 표시되고, 클릭 시 `currentImageIndex`가 순환(첫 장에서 이전 클릭 시 마지막 장으로, 마지막 장에서 다음 클릭 시 첫 장으로) 이동한다.
   - 이미지 영역에서 마우스로 좌/우 드래그(또는 터치 스와이프) 시 일정 임계값(예: 50px) 이상 이동하면 이전/다음 이미지로 전환된다.
   - 기존 닷 인디케이터는 그대로 유지하고 현재 인덱스와 동기화된다.
   - 이미지가 1장 이하일 때는 화살표 버튼이 보이지 않는다 (기존 닷 인디케이터 조건과 동일).
   - 드래그 중 `<img>`의 네이티브 드래그(고스트 이미지)는 발생하지 않는다 (`draggable="false"` 추가).

## Implementation Steps

### 1. Nav 드래그 방지 — `src/components/layout/AppHeader.vue`

- 헤더 루트 컨테이너(46행 `class="h-full flex items-center px-10 sm:px-14 md:px-18 md:mx-auto md:max-w-[1600px]"`)에 `select-none` 추가.
- 검색 `<input>`이 포함된 `<div class="flex-1 flex justify-center px-2 sm:px-4">`(78행) 블록에는 `select-text`로 명시적으로 되돌려, 입력창 텍스트 선택은 막지 않는다.
- 로고 `<img>` 엘리먼트에 `draggable="false"` 속성 추가.
- 모바일 드롭다운(177행 `<div v-if="!isDesktop && mobileMenuOpen ...">`)에도 `select-none` 추가.

### 2. 스크롤바 숨김 — `src/style.css` + 4개 패널 컴포넌트

- `src/style.css`에 유틸리티 추가:
  ```css
  .scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  ```
- `ListingListPanel.vue:95`, `ListingDetailPanel.vue:108`, `MarketListPanel.vue:89`, `MarketDetailPanel.vue:86`의 `overflow-y-auto` 클래스 옆에 `scrollbar-hide` 추가.

### 3. 사진 캐러셀 — `src/components/listing/ListingDetailPanel.vue`

- `<script setup>`에 `ChevronLeft`, `ChevronRight`를 `lucide-vue-next`에서 import.
- 다음 함수 추가:
  ```ts
  function prevImage() {
    if (!detail.value?.images?.length) return
    const len = detail.value.images.length
    currentImageIndex.value = (currentImageIndex.value - 1 + len) % len
  }
  function nextImage() {
    if (!detail.value?.images?.length) return
    const len = detail.value.images.length
    currentImageIndex.value = (currentImageIndex.value + 1) % len
  }
  ```
- 드래그/스와이프는 네이티브 Pointer Events로 구현 (새 의존성 불필요):
  ```ts
  const dragStartX = ref<number | null>(null)
  function onPointerDown(e: PointerEvent) {
    dragStartX.value = e.clientX
  }
  function onPointerUp(e: PointerEvent) {
    if (dragStartX.value === null) return
    const delta = e.clientX - dragStartX.value
    if (Math.abs(delta) > 50) {
      delta > 0 ? prevImage() : nextImage()
    }
    dragStartX.value = null
  }
  ```
- 템플릿 127~147행의 이미지 블록을 다음과 같이 수정:
  - 이미지 컨테이너에 `@pointerdown="onPointerDown"` `@pointerup="onPointerUp"` 추가, `cursor-grab active:cursor-grabbing` 클래스 추가.
  - `<img>`에 `draggable="false"` 추가 (네이티브 드래그 고스트 방지).
  - `detail.images.length > 1`일 때만 보이는 좌측 `ChevronLeft`/우측 `ChevronRight` 버튼 추가 (`@click.stop="prevImage"` / `@click.stop="nextImage"`, `absolute left-3/right-3 top-1/2 -translate-y-1/2`, 기존 닷 인디케이터와 동일한 반투명 배경 스타일로 통일).
  - 기존 닷 인디케이터 블록은 그대로 유지.

## Risks and Mitigations

| Risk                                                                                               | Mitigation                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `select-none`을 헤더 전체에 걸면 검색 입력창 텍스트도 선택 안 될 수 있음                           | 검색 input이 포함된 블록에 `select-text`로 명시적으로 재정의                                                                                                               |
| 드래그 임계값(50px)이 너무 작아 일반 클릭에도 이미지가 넘어갈 수 있음                              | `pointerup`에서만 delta 계산, 클릭(드래그 없음)은 delta=0이라 영향 없음. 필요시 QA 중 임계값 조정                                                                          |
| `scrollbar-hide`가 Firefox/Safari 등 일부 브라우저에서 표준 속성 미지원 시 스크롤바가 남을 수 있음 | `scrollbar-width`(Firefox), `-ms-overflow-style`(레거시 Edge), `::-webkit-scrollbar`(Chrome/Safari) 3종 모두 적용해 주요 브라우저 커버                                     |
| 화살표 버튼과 닷 인디케이터 클릭이 드래그 핸들러와 충돌(클릭 시 pointerup이 같이 발동)             | 버튼에 `@click.stop` 사용, 버튼은 이미지 위에 absolute로 얹혀 있어도 pointerdown이 버튼에서 시작되면 버튼의 클릭 핸들러만 동작 — 별도 stopPropagation 처리로 안전하게 분리 |

## Verification Steps

1. `yarn dev` 후 브라우저에서 nav 바를 마우스로 누르고 좌우로 드래그 → 텍스트 선택(파란 하이라이트)이 발생하지 않는지 확인. 검색 입력창은 여전히 텍스트 선택 가능한지 확인.
2. 매물탭 좌측 리스트, 매물 상세 패널, 실거래가탭 좌측 리스트, 실거래가 상세 패널에서 콘텐츠를 스크롤 가능한 양만큼 채운 뒤 — 스크롤바가 안 보이지만 마우스 휠로 스크롤이 정상 동작하는지 확인.
3. 이미지 2장 이상인 매물 상세를 열어 — 좌/우 화살표 클릭 시 이미지가 순환 전환되는지, 이미지 영역을 마우스로 드래그(50px 이상)했을 때 방향에 맞게 전환되는지, 닷 인디케이터가 현재 인덱스와 동기화되는지 확인. 이미지 1장 이하인 매물에서는 화살표가 보이지 않는지 확인.
4. `yarn build` (`vue-tsc -b && vite build`)로 타입 에러 없는지 확인.

## ADR (간단 요약)

- **Decision**: 캐러셀은 외부 라이브러리 없이 네이티브 Pointer Events + 기존 `currentImageIndex` 상태로 구현. 스크롤바 숨김은 Tailwind 플러그인 추가 없이 `style.css`에 순수 CSS 유틸리티 클래스 추가.
- **Drivers**: 의존성 최소화, 기존 `@vueuse/core`/`lucide-vue-next`만으로 충분히 구현 가능한 단순 요구사항.
- **Alternatives considered**: Embla/Swiper 같은 캐러셀 라이브러리 도입 — 기각(이 화면은 이미지 1장짜리 단일 슬라이드 영역이라 라이브러리 오버헤드 대비 이득이 적음). `tailwind-scrollbar-hide` 플러그인 도입 — 기각(3줄 CSS로 충분, 새 의존성 불필요).
- **Consequences**: 향후 핀치줌, 모멘텀 스크롤 등 고급 제스처가 필요해지면 라이브러리 도입을 재검토해야 함.
- **Follow-ups**: `MarketDetailPanel`에 향후 이미지 필드가 추가되면 동일한 캐러셀 패턴 재사용 가능.
