# 매물 목록/상세 페이지 분리 + 페이지네이션 URL화 + 상세 레이아웃 고정

**Status:** pending approval

## Requirements Summary

1. `/list` 경로에 매물 **목록 전용 페이지**(`ListingListView.vue`)를 새로 만든다. 현재 `/`(HomeView)의 split 레이아웃(목록+상세 동시 표시)은 그대로 유지한다.
2. `/list`에서 매물을 클릭하면 이미 존재하는 `/listings/:id` (`ListingDetailView.vue`)로 이동한다 — 상세는 이미 라우트가 있으므로 URL 그대로 공유 가능.
3. 목록 페이지(`/list`)의 페이지네이션 상태를 **URL 쿼리(`?page=N`)에 동기화**해서 새로고침/링크 공유 시에도 동일한 페이지가 유지되게 한다. (현재 `ListingListPanel.vue`는 페이지 상태가 컴포넌트 로컬 `ref`에만 있어 URL에 반영되지 않음 — `src/components/listing/ListingListPanel.vue:24,35-49`)
4. 매물 상세 화면에서 목록 항목을 바꿀 때 화면이 "들쑥날쑥"(레이아웃 점핑)하는 문제를 고친다.

## Root Cause — 레이아웃 점핑

`ListingDetailPanel.vue` (`src/components/listing/ListingDetailPanel.vue:85-106`)의 `watch(props.listingId, ...)`는 `detail`을 `null`로 비웠다가 새 데이터로 교체하지만, 스크롤 컨테이너(`<div class="h-full overflow-y-auto ...">`, 줄 156)의 `scrollTop`을 리셋하지 않는다. 사용자가 이전 매물에서 아래로 스크롤한 상태로 다른 매물을 클릭하면, 새 매물의 콘텐츠가 로드된 후에도 스크롤 위치가 유지되어 새 매물의 중간/하단 섹션이 보이며 화면이 "점핑"한 것처럼 보인다. 추가로 `Transition` (줄 172, `translateY: [8,0]`)이 매번 전체 블록을 리마운트하면서 위아래로 흔들리는 느낌을 더한다.

## Acceptance Criteria

- [ ] `/list` 접속 시 매물 목록만 보이는 전용 페이지가 렌더된다 (AppHeader 포함, split 패널 없음).
- [ ] `/list?page=2`로 직접 접속하면 2페이지가 바로 로드된다.
- [ ] `/list`에서 페이지네이션 버튼 클릭 시 URL의 `page` 쿼리가 갱신된다 (브라우저 뒤로가기로 이전 페이지 복원 가능).
- [ ] `/list`에서 매물 카드를 클릭하면 `/listings/:id`로 이동하고, 해당 URL을 그대로 복사해 새 탭에서 열어도 동일한 상세가 보인다 (이미 동작 — 회귀 없음만 확인).
- [ ] `/` (HomeView) 의 기존 split 동작은 변경되지 않는다 (회귀 없음).
- [ ] `ListingDetailPanel.vue`에서 다른 매물로 전환 시 스크롤 위치가 항상 맨 위로 리셋된다.
- [ ] 빠르게 여러 매물을 연속 클릭해도 화면이 위아래로 튀는 현상이 없다 (수동 확인).
- [ ] `npm run build` (vue-tsc) 통과.

## Implementation Steps

### 1. 라우터에 `/list` 추가
**파일:** `src/router/index.ts`
- `/` 라우트(줄 9-12) 바로 아래에 신규 라우트 추가:
```ts
{
  path: '/list',
  name: 'listing-list',
  component: () => import('@/views/ListingListView.vue'),
},
```

### 2. `ListingListPanel.vue`에 URL 동기화용 controlled page 지원 추가
**파일:** `src/components/listing/ListingListPanel.vue`
- `defineProps`에 `initialPage?: number` 추가 (줄 16-18 근처).
- `currentPage` 초기값을 `props.initialPage ?? 0`으로 설정.
- `defineEmits`에 `'page-change': [page: number]` 추가.
- `goToPage()` (줄 56-58)에서 `fetchListings(page)` 호출 후 `emit('page-change', page)` 호출.
- `onMounted(() => fetchListings(props.initialPage ?? 0))`로 변경 (기존 `fetchListings(0)`, 줄 76).
- 기존 `HomeView`/`ListingListPanel` 사용처는 `initialPage`를 안 넘기면 기존과 동일하게 0부터 시작하므로 회귀 없음.

### 3. 신규 `src/views/ListingListView.vue` 작성
- `AppHeader` + `ListingListPanel`을 전체 페이지 레이아웃으로 감싼 새 뷰.
- `useRoute`/`useRouter`로 `route.query.page`를 읽어 `initialPage` prop으로 전달 (0-based, 쿼리는 1-based로 노출: `Number(route.query.page ?? 1) - 1`).
- `ListingListPanel`의 `@select`: `router.push(`/listings/${listing.id}`)`로 상세 이동 (HomeView처럼 로컬 상태 전환 아님).
- `ListingListPanel`의 `@page-change`: `router.replace({ query: { ...route.query, page: page + 1 } })`로 쿼리 갱신 (히스토리 오염 방지 위해 `replace` 사용).
- 레이아웃: `AppHeader` 고정 헤더 아래 `pt-14`, `max-w-[1600px] md:mx-auto` 등 기존 `HomeView`/`ListingDetailView`와 동일한 패딩 컨벤션 사용 (앞서 고친 `HomeView.vue:24` 패턴 재사용).

### 4. `ListingDetailPanel.vue` 레이아웃 고정 — 스크롤 리셋 + 점핑 완화
**파일:** `src/components/listing/ListingDetailPanel.vue`
- 스크롤 컨테이너(줄 156)에 `ref="scrollEl"` 추가.
- `watch(props.listingId, ...)` (줄 85) 핸들러 시작 부분에 `scrollEl.value?.scrollTo({ top: 0 })` 추가 — `detail`을 비우기 전에 호출해 다음 paint에 항상 최상단에서 시작.
- `Transition`의 `onDetailEnter` (줄 131-139)에서 `translateY: [8, 0]`을 제거하고 `opacity`만 페이드시켜 수직 흔들림 제거 (선택적이지만 "고정 레이아웃" 요구에 부합).
- 이미지 영역(줄 176)·기본정보 그리드(줄 240) 등은 이미 고정 높이/구조이므로 변경 없음.

### 5. (선택) `ListingDetailView.vue` 동일 스크롤 리셋 적용
**파일:** `src/views/ListingDetailView.vue`
- 이 뷰는 `route.params.id`가 바뀔 때 컴포넌트가 리마운트되므로(같은 컴포넌트 인스턴스 재사용 안 함) 스크롤 점핑 이슈가 상대적으로 적지만, Vue Router 특성상 동일 라우트의 `params`만 바뀌면 컴포넌트가 재사용되어 동일 문제가 발생할 수 있음. `onBeforeRouteUpdate` 가드를 추가해 `window.scrollTo(0, 0)` 호출.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| `ListingListPanel` props 변경이 `HomeView`의 기존 사용을 깨뜻릴 수 있음 | `initialPage`/`page-change`를 모두 optional로 추가, 기본값 유지로 하위 호환 |
| `/list`와 `/` 모두 같은 `ListingListPanel`을 쓰므로 중복 로직 가능성 | 컴포넌트는 그대로 재사용, 뷰 레벨에서만 라우팅/쿼리 동기화 차이를 둠 |
| 쿼리 동기화 시 무한 루프(`watch` ↔ `push`) | `page-change` emit은 사용자 클릭으로만 트리거되므로 `route.query` watch는 두지 않고 단방향(query → initialPage prop, 클릭 → query push)으로 설계 |
| 스크롤 리셋이 일부 브라우저에서 애니메이션 끊김으로 보일 수 있음 | `scrollTo({ top: 0 })` 동기 호출 (behavior 미지정 = instant)로 즉시 리셋 |

## Verification Steps

1. `/list` 접속 → 목록만 보이는지, AppHeader 포함되는지 확인.
2. `/list`에서 2페이지로 이동 → URL이 `/list?page=2`로 바뀌는지 확인 → 새로고침 시 2페이지 유지되는지 확인.
3. `/list`에서 매물 클릭 → `/listings/:id`로 이동 확인 → 새 탭에 URL 붙여넣기로 동일 상세 로드 확인.
4. `/`에서 기존 split 동작(좌측 목록, 우측 상세, 모바일 토글) 회귀 없는지 확인.
5. `/`에서 스크롤을 내린 채 다른 매물 클릭 → 상세 패널이 항상 맨 위에서 시작하는지 확인 (들쑥날쑥 재현 안 됨).
6. `npm run build` 실행해 타입 에러 없는지 확인.

## ADR

- **Decision:** 기존 `/` split 레이아웃은 유지하고, `/list`를 신규 목록 전용 페이지로 추가한다. 상세는 이미 존재하는 `/listings/:id`를 그대로 재사용한다.
- **Drivers:** 회귀 최소화(기존 `/` 사용자 경험 보존), 상세 라우트는 이미 공유 가능하므로 중복 구현 불필요, 페이지네이션을 URL화해 목록도 공유/북마크 가능하게.
- **Alternatives considered:**
  - `/`를 `/list`로 완전히 대체: 더 단순하지만 기존 split UX(데스크톱에서 목록+상세 동시 보기)를 제거하게 되어 사용자가 명시적으로 거부.
  - split 레이아웃 제거하고 목록 클릭 시 라우터로 상세 이동: 가장 단순하지만 데스크톱 동시 보기 UX 손실.
- **Why chosen:** 사용자가 명시적으로 "/list 신규, '/' 유지"를 선택함.
- **Consequences:** `ListingListPanel`이 두 가지 모드(controlled/uncontrolled page)를 지원해야 해 약간의 prop 분기가 생기지만 하위 호환 유지.
- **Follow-ups:** 추후 `/`의 split 레이아웃도 동일하게 쿼리 동기화할지 여부는 별도 논의.
