# 매물/실거래가 리스트·상세 전환 모션 인터랙션 추가

**Status:** pending approval
**Mode:** Direct plan (no consensus loop)

## Requirements Summary

1. 매물탭/실거래가탭 리스트에 새 데이터가 로드될 때 카드들이 순차적으로(스태거) "촤라락" 나타나는 효과를 준다.
2. 리스트 항목을 클릭해 상세 패널의 내용이 바뀔 때, 단순 교체가 아니라 인터랙티브한 전환 효과(페이드+슬라이드)로 나타난다.
3. 이미 설치돼 있지만 전혀 쓰이지 않는 `animejs`를 활용한다.

## Current State (codebase facts)

- **animejs**: [package.json:15](package.json:15)에 `"animejs": "^4.4.1"` 설치돼 있으나 `src/` 어디서도 import/사용 없음 (`grep` 결과 0건). v4는 v3와 API가 완전히 다른 네임드 익스포트 방식 — `import { animate, stagger } from 'animejs'` (default export 없음, `anime()` 함수 형태 아님). 확인됨: `node -e "console.log(Object.keys(require('animejs')))"` → `animate`, `stagger`, `easings` 등 포함.
- **리스트 렌더링**: [ListingListPanel.vue:110-118](src/components/listing/ListingListPanel.vue:110), [MarketListPanel.vue:98-106](src/components/market/MarketListPanel.vue:98) 둘 다 단순 `v-for` + `:key`, `<TransitionGroup>` 없음. 카드 컴포넌트([ListingCard.vue](src/components/listing/ListingCard.vue), [MarketCard.vue](src/components/market/MarketCard.vue)) 루트는 단일 `<div>`라 fallthrough 속성(`:data-idx` 등) 전달 가능.
- **상세 패널 전환**: [HomeView.vue:29-55](src/views/HomeView.vue:29), [MarketView.vue](src/views/MarketView.vue) 동일 구조 — `aside`/`section`을 `v-if`로 토글(모바일에서만 실제 mount/unmount 발생, 데스크톱은 둘 다 항시 렌더링). 데스크톱에서는 `selectedListingId`가 바뀌어도 `<section>` 자체는 그대로고, 내부 `ListingDetailPanel`에 prop만 바뀜 → 패널 내부의 `<template v-else-if="detail">` 콘텐츠가 와치(watch)로 다시 채워질 뿐 자체 전환 효과 없음 ([ListingDetailPanel.vue:160](src/components/listing/ListingDetailPanel.vue:160), [MarketDetailPanel.vue:109](src/components/market/MarketDetailPanel.vue:109)).
- **Vue 버전**: [package.json:21](package.json:21) `vue@^3.5.34` — `<Transition>`/`<TransitionGroup>` 풀 지원. `@vueuse/core`는 설치돼 있으나 모션 관련 컴포저블(`useMotion` 등) 사용 이력 없음.
- **기존 트랜지션 컨벤션**: Tailwind `transition-colors` 정도만 쓰이고 있고, `style.css`에 커스텀 `@keyframes`/`.fade-`/`.slide-` 클래스 없음.

## Acceptance Criteria

1. **리스트 스태거 진입**
   - 매물탭/실거래가탭에서 리스트가 처음 로드되거나 필터 변경으로 `listings`/`properties` 배열이 교체될 때, 각 카드가 `translateY(16px) → 0`, `opacity 0 → 1`로 약 300ms 동안 페이드인하며, 카드 간 시작 시점에 약 30~40ms씩 차이(스태거)가 있어야 한다.
   - 새로 추가/제거되는 카드(필터링 등)에도 동일한 enter 애니메이션이 적용된다 (leave는 단순 페이드아웃, 스태거 불필요).
   - 스크롤 위치, 클릭 가능 여부 등 기존 동작에 회귀가 없어야 한다.

2. **상세 패널 콘텐츠 전환**
   - 리스트 항목 클릭 → 새 매물/실거래가 데이터로 바뀔 때, 상세 패널 콘텐츠가 `opacity 0→1` + `translateY(8px)→0`로 약 250ms 페이드인 전환된다.
   - 모바일(리스트↔상세 풀스크린 swap)에서도 동일한 전환 느낌이 유지된다 (기존 `v-if` mount/unmount 위에 `<Transition>` 추가).
   - 로딩 스피너 표시 중에는 전환 애니메이션이 끼어들지 않는다 (로딩 종료 후 데이터가 채워지는 순간에만 트리거).

3. **공통**
   - `animejs`(v4 named export `animate`, `stagger`)를 사용해 구현한다. 추가 npm 패키지 설치 없음.
   - `yarn build`(`vue-tsc -b && vite build`) 타입 에러 없이 통과.

## Implementation Steps

### 1. 리스트 스태거 — `ListingListPanel.vue`, `MarketListPanel.vue`

각 파일에서 카드 `v-for` 블록을 `<TransitionGroup>`으로 감싸고, JS 훅으로 anime.js를 연결한다.

```vue
<script setup lang="ts">
import { animate, stagger } from 'animejs'
// ...

function onCardEnter(el: Element, done: () => void) {
  animate(el, {
    translateY: [16, 0],
    opacity: [0, 1],
    duration: 300,
    delay: stagger(35),
    easing: 'easeOutCubic',
    onComplete: done,
  })
}
function onCardLeave(el: Element, done: () => void) {
  animate(el, { opacity: [1, 0], duration: 150, onComplete: done })
}
</script>

<template>
  <TransitionGroup tag="div" :css="false" appear @enter="onCardEnter" @leave="onCardLeave">
    <ListingCard
      v-for="listing in listings"
      :key="listing.id"
      :listing="listing"
      :selected="listing.id === selectedId"
      @select="emit('select', $event)"
    />
  </TransitionGroup>
</template>
```

- `<TransitionGroup>`은 `<template v-else>` 자리를 그대로 대체한다 (`v-if="loading"`/`v-else-if="listings.length === 0"` 분기는 그대로 유지, `v-else` 블록만 `<TransitionGroup>`으로 교체).
- anime.js v4의 `stagger()`는 `TransitionGroup`이 각 엔터 콜백을 개별 호출하는 구조와 정확히 맞물리지 않으므로(각 엔터가 동시에 batch로 안 들어올 수 있음), `stagger()`가 기대한 효과가 안 나오면 대체 방안으로 카드에 `:data-idx="index"`를 추가하고 `onCardEnter`에서 `el.dataset.idx`를 읽어 `delay: Number(el.dataset.idx) * 35`로 수동 계산한다 (Risks 참고).
- `MarketListPanel.vue`도 동일 패턴 적용 (`MarketCard` 대상).

### 2. 상세 패널 콘텐츠 전환 — `ListingDetailPanel.vue`, `MarketDetailPanel.vue`

`v-else-if="detail"`(또는 `property`) 분기의 콘텐츠를 `:key`를 가진 단일 래퍼로 감싸고, 그 래퍼를 `<Transition>`으로 감싼다.

```vue
<script setup lang="ts">
import { animate } from 'animejs'

function onDetailEnter(el: Element, done: () => void) {
  animate(el, {
    translateY: [8, 0],
    opacity: [0, 1],
    duration: 250,
    easing: 'easeOutCubic',
    onComplete: done,
  })
}
</script>

<template>
  <div v-if="!listingId">...</div>
  <div v-else-if="loading">...</div>
  <Transition :css="false" @enter="onDetailEnter">
    <div v-if="detail" :key="detail.id">
      <!-- 기존 v-else-if="detail" 내부 콘텐츠 그대로 -->
    </div>
  </Transition>
</template>
```

- `:key="detail.id"`가 바뀌면 같은 분기 안에서도 Vue가 새 엘리먼트로 취급해 `<Transition>`이 재생됨 (mount/unmount 없이도 전환 트리거).
- `MarketDetailPanel.vue`는 `property.id`를 키로 동일하게 적용.
- 모바일 풀스크린 swap은 `HomeView.vue`/`MarketView.vue`의 `aside`/`section` `v-if` 토글에 추가 `<Transition>`을 씌우는 대신, 이미 내부 패널에 추가한 전환으로 충분히 커버됨 (별도 라우트 레벨 전환은 이번 스코프에서 제외).

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| anime.js v4의 `stagger()`가 Vue `TransitionGroup`의 개별 enter 호출 타이밍과 안 맞아 스태거가 기대대로 안 보일 수 있음 | 1차로 `stagger()` 시도, 어색하면 `:data-idx` 기반 수동 delay 계산으로 즉시 대체 (구현 단계에 명시) |
| `<TransitionGroup :css="false">`에서 `done()` 콜백을 안 부르면 다음 트랜지션이 멈춤 | anime.js의 `onComplete`에서 반드시 `done()` 호출 (코드 예시에 포함) |
| 상세 패널에서 `:key="detail.id"`만 바뀌어도 매번 전체 DOM 재마운트 → NaverMap 같은 무거운 자식 컴포넌트가 매 클릭마다 다시 초기화되어 성능/지도 재로딩 깜빡임 발생 가능 | 지도 등 무거운 하위 컴포넌트는 이미 `:key="detail.id"`로 별도 강제 리마운트 중인 패턴이 기존에도 있었음([ListingDetailPanel.vue]의 `<NaverMap :key="detail.id" .../>`) — 동일 전제이므로 추가 회귀 아님. 다만 체감 끊김이 크면 전환 대상을 헤더/이미지 영역만으로 축소하는 것도 옵션 |
| 짧은 시간에 리스트 항목을 빠르게 여러 번 클릭하면 이전 enter 애니메이션이 끝나기 전에 다음 게 시작되어 애니메이션이 겹치거나 끊길 수 있음 | anime.js는 동일 타겟 재호출 시 기존 애니메이션을 자동으로 덮어씀(v4 기본 동작) — 별도 처리 불필요, QA 단계에서 빠른 연속 클릭 확인 |
| `prefers-reduced-motion` 사용자 접근성 미고려 | 이번 스코프에서는 제외하고 별도 후속 작업으로 남김 (Follow-ups에 기록) |

## Verification Steps

1. `yarn dev`로 매물탭 열고 새로고침 → 카드들이 순차적으로 페이드인되는지 확인 (스태거 간격 체감).
2. 필터(거래유형/가격대/지역/연도월)를 바꿔 리스트가 새로 채워질 때도 동일하게 스태거 진입하는지 확인.
3. 실거래가탭에서 동일하게 확인.
4. 데스크톱 너비에서 리스트의 매물을 연달아 여러 개 클릭 → 상세 패널 콘텐츠가 매번 페이드+슬라이드로 전환되는지, 지도가 깨지거나 끊기지 않는지 확인.
5. 모바일 너비(또는 좁은 뷰포트)로 리사이즈 후 항목 클릭 → 상세 패널로 전체 전환될 때도 동일 전환이 보이는지, "목록으로" 버튼으로 되돌아갈 때 깨지지 않는지 확인.
6. `yarn build` 통과 확인 (타입 에러 없음).

## ADR (간단 요약)

- **Decision**: 리스트 스태거는 Vue `<TransitionGroup>` + anime.js v4(`animate`, `stagger`) JS 훅으로, 상세 패널 전환은 `<Transition>` + `:key` 기반 강제 리엔터로 구현한다.
- **Drivers**: (1) 이미 설치돼 있는 미사용 의존성(`animejs`) 활용 — 새 패키지 설치 없음. (2) Vue 3 네이티브 Transition API와 결합하면 mount/unmount 생명주기를 그대로 활용할 수 있어 별도 상태 관리 불필요. (3) 기존 코드베이스에 트랜지션 컨벤션이 전혀 없어 새로 확립하는 것이므로, 가장 단순하고 예측 가능한 패턴(JS 훅 + key) 선택.
- **Alternatives considered**:
  - CSS-only `<TransitionGroup>` (`name="list"` + CSS 클래스): 기각하지 않고 보류 — 더 가볍지만 anime.js의 정교한 stagger 이징을 못 씀. 사용자가 명시적으로 "motion/animation 라이브러리 적용"을 요청했으므로 anime.js 경로를 채택.
  - `@vueuse/core`의 모션 컴포저블(`useMotion` 계열은 별도 패키지 `@vueuse/motion`이라 현재 미설치): 새 의존성 추가가 필요해 기각.
- **Consequences**: 향후 다른 화면(채팅 목록, 알림 등)에도 동일한 enter/leave 패턴을 재사용할 수 있는 작은 컨벤션이 생긴다. anime.js v4 API(named export)를 팀이 처음 쓰게 되므로 코드 리뷰 시 v3 문서(`anime({...})` 형태)와 혼동하지 않도록 주의 필요.
- **Follow-ups**: `prefers-reduced-motion` 대응, 채팅/알림 등 다른 리스트에도 동일 패턴 확장 여부는 별도 논의.
