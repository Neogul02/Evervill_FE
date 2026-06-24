# UI/UX 반응속도 개선 (Phase 1) + 코드 정리 백로그

> 상태: **pending approval** (계획 단계 — 아직 구현 시작 안 함)

## 배경

"전체 코드정리, 클린코드화, UI/UX 반응속도 개선, 불필요한 코드 정리"라는 광범위한 요청을 조사한 결과, 4개 방향 모두를 한 번에 다루기엔 범위가 넓어 우선순위를 정했다. 인터뷰 결과 **UI/UX 반응속도 개선을 1순위**로 진행하기로 했고, 나머지(데드코드 제거, 핵심 파일 분할, 린트 도입)는 Phase 2/3 백로그로 남긴다.

## 조사 결과 요약 (사실 확인)

| 항목 | 현황 |
|---|---|
| `<img>` 태그 | 총 17곳, `loading="lazy"` 적용 0건 |
| 검색/필터 입력 debounce | **이미 구현되어 있음** — `FilterBar.vue`/`MarketFilterBar.vue`에 400ms `setTimeout` 기반 수동 디바운스가 각각 동일한 로직으로 중복 구현됨 |
| 매물/실거래가 목록 | 서버 사이드 페이지네이션(`size: 20`) 적용 중 — 무한 리스트/가상화 문제 없음 ([ListingListPanel.vue](../../src/components/listing/ListingListPanel.vue):26-50) |
| ESLint/Prettier | 설정 없음, `package.json` 스크립트는 `dev`/`build`/`preview`뿐 (lint/test 없음) |
| `console.log`/TODO/FIXME | 거의 없음 (깨끗함) |
| 데드코드 후보 | `src/views/ApiTestView.vue`(370줄) — 인증 가드 없이 `/api-test` 라우트로 프로덕션에 노출된 개발용 테스트 페이지 |
| 중복 보일러플레이트 | 16개 파일에서 `isLoading`/`loading` + try/catch/finally 패턴이 거의 동일하게 반복 |
| 대형 파일 | `ListingDetailPanel.vue`(694줄), `ChatView.vue`(469줄), `MyProfileView.vue`(436줄), `AdminView.vue`(314줄) |

> **인터뷰 중 정정한 사항**: 처음에는 "검색 input에 debounce가 없다"는 가정으로 질문했으나, 실제로는 이미 두 파일에 각각 구현돼 있었다. 따라서 "debounce 추가"가 아니라 **"중복된 debounce 로직을 공유 composable로 통합"**이 실질적으로 동등한 개선 항목이다.

---

## Phase 1 (이번 계획 대상): UI/UX 반응속도 개선

### 1.1 이미지 lazy loading 적용

대상 17개 `<img>` 위치:

| 파일 | 라인 | 비고 |
|---|---|---|
| [ChatView.vue](../../src/views/ChatView.vue) | 338, 380 | 매물 배너 이미지, 발신자 프로필 |
| [RegistryAnalysisView.vue](../../src/views/RegistryAnalysisView.vue) | 111 | 업로드 미리보기 (lazy 불필요 — 즉시 렌더 대상) |
| [RegisterView.vue](../../src/views/RegisterView.vue) | 92 | 프로필 이미지 미리보기 (lazy 불필요) |
| [ListingEditView.vue](../../src/views/ListingEditView.vue) | 293, 306 | 매물 이미지 편집 미리보기 (lazy 불필요) |
| [ListingCreateView.vue](../../src/views/ListingCreateView.vue) | 238 | 업로드 미리보기 (lazy 불필요) |
| [my/RecentListingsView.vue](../../src/views/my/RecentListingsView.vue) | 56 | 목록 썸네일 — **적용 대상** |
| [LoginView.vue](../../src/views/LoginView.vue) | 56, 113 | 로고/카카오 버튼 (above-the-fold — lazy 불필요) |
| [my/MyProfileView.vue](../../src/views/my/MyProfileView.vue) | 176 | 프로필 이미지 — **적용 대상** |
| [my/MyListingsView.vue](../../src/views/my/MyListingsView.vue) | 66 | 목록 썸네일 — **적용 대상** |
| [my/MyBookmarksView.vue](../../src/views/my/MyBookmarksView.vue) | 129 | 목록 썸네일 — **적용 대상** |
| [components/layout/AppHeader.vue](../../src/components/layout/AppHeader.vue) | 65 | 헤더 프로필 아이콘 (above-the-fold — lazy 불필요) |
| [components/listing/ListingCard.vue](../../src/components/listing/ListingCard.vue) | 50 | 매물 카드 썸네일 — **핵심 적용 대상** (목록 페이지당 최대 20개 렌더) |
| [components/listing/ListingDetailPanel.vue](../../src/components/listing/ListingDetailPanel.vue) | 261, 542 | 매물 상세 메인 이미지(261, above-the-fold — lazy 불필요), 갤러리/서브 이미지(542) — **542만 적용 대상** |

**작업 방향**: 업로드 미리보기/above-the-fold(첫 화면에 바로 보이는) 이미지는 제외하고, **목록형 썸네일과 스크롤해야 보이는 이미지만** `loading="lazy"` + `decoding="async"` 추가. 가장 효과가 큰 곳은 `ListingCard.vue`(목록 페이지에서 최대 20장 동시 렌더)와 4개 목록 뷰의 썸네일.

### 1.2 검색 debounce 로직 공유화

현재 중복:
- [FilterBar.vue](../../src/components/listing/FilterBar.vue):31, 53-56 — `keywordTimer` + `setTimeout(emitUpdate, 400)`
- [MarketFilterBar.vue](../../src/components/market/MarketFilterBar.vue):23, 58-61 — 동일한 로직 복붙

**작업**: `@vueuse/core`가 이미 의존성에 포함돼 있으므로([package.json](../../package.json):11) `watchDebounced`(VueUse 제공)로 교체해 두 파일의 중복 `setTimeout`/`clearTimeout` 코드를 제거. 디바운스 지연시간(400ms)을 상수로 한 곳에서 관리.

```ts
// 변경 전 (FilterBar.vue, MarketFilterBar.vue 각각 중복)
let keywordTimer: ReturnType<typeof setTimeout> | undefined
watch(keyword, () => {
  clearTimeout(keywordTimer)
  keywordTimer = setTimeout(emitUpdate, 400)
})

// 변경 후 (두 파일 동일하게)
import { watchDebounced } from '@vueuse/core'
watchDebounced(keyword, emitUpdate, { debounce: 400 })
```

---

## Acceptance Criteria

- [ ] `ListingCard.vue`, `RecentListingsView.vue`, `MyListingsView.vue`, `MyBookmarksView.vue`, `ListingDetailPanel.vue`(542줄 갤러리)의 썸네일/갤러리 `<img>`에 `loading="lazy"` + `decoding="async"`가 적용된다.
- [ ] above-the-fold 이미지(로고, 헤더 아이콘, 매물 상세 메인 이미지, 각종 업로드 미리보기)는 그대로 즉시 로드되어 첫 화면 표시 지연이 생기지 않는다.
- [ ] `FilterBar.vue`, `MarketFilterBar.vue`의 키워드 입력 디바운스 동작(타이핑 멈춘 뒤 400ms 후 검색 실행)이 `watchDebounced` 적용 후에도 기존과 동일하게 동작한다.
- [ ] 두 파일에서 수동 `setTimeout`/`clearTimeout` 코드가 제거되고 `watchDebounced`로 대체된다.
- [ ] `yarn build`(`vue-tsc -b && vite build`)가 타입 에러 없이 통과한다.

## Risks and Mitigations

| 리스크 | 완화 방안 |
|---|---|
| `loading="lazy"`를 above-the-fold 이미지에도 잘못 적용하면 초기 렌더가 오히려 늦어 보일 수 있음 | 1.1 표에서 "lazy 불필요"로 표시한 이미지는 제외하고 목록/갤러리 이미지에만 한정 적용 |
| `watchDebounced` 마이그레이션 시 `emitUpdate`가 다른 watch(`dealType`/`priceRange` 등)와 동시에 걸려있어 타이밍이 달라질 가능성 | 키워드 watch만 `watchDebounced`로 교체하고, 나머지 즉시 반영 watch는 그대로 유지 — 동작 범위를 최소화 |
| 구형 브라우저에서 `loading="lazy"` 미지원 | 모든 주요 모던 브라우저(Chrome/Edge/Firefox/Safari 16+)가 지원하므로 폴리필 불필요, 미지원 브라우저는 즉시 로드로 자연 폴백 |

## Verification Steps

1. `yarn build` 실행해 타입 에러 없는지 확인.
2. 매물 목록(`/`) 페이지를 열고 브라우저 개발자도구 Network 탭에서 스크롤 전/후 이미지 요청 타이밍이 lazy 적용 전후로 달라지는지 확인 (스크롤 전 미로드 확인).
3. `/market` 페이지와 매물 목록 페이지에서 검색어 입력 시 400ms 디바운스가 유지되는지(타이핑 중 API가 매 키 입력마다 호출되지 않는지) Network 탭으로 확인.
4. 매물 상세 페이지 첫 진입 시 메인 이미지가 즉시 표시되는지(레이지 적용 안 됨) 확인.

---

## Phase 2 백로그 (이번 계획 범위 아님 — 추후 별도 계획)

- `src/views/ApiTestView.vue`(370줄) 제거 또는 `import.meta.env.DEV` 가드 추가 — `/api-test` 라우트가 프로덕션에 인증 가드 없이 노출됨 ([router/index.ts](../../src/router/index.ts):109-113)
- 16개 파일에 중복된 `isLoading`/try-catch-finally 패턴을 공유 composable(예: `useAsyncAction`)로 추출

## Phase 3 백로그 (이번 계획 범위 아님 — 추후 별도 계획)

- `ListingDetailPanel.vue`(694줄), `ChatView.vue`(469줄), `MyProfileView.vue`(436줄), `AdminView.vue`(314줄) 책임 단위 분할
- ESLint(+Prettier) 도입 및 `package.json`에 `lint` 스크립트 추가 — 현재 lint/test 스크립트 자체가 없음
