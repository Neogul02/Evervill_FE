# 북마크 상태/북마크수/최근 본 매물 대응 (pending approval)

## Requirements Summary

백엔드가 매물/실거래가 API 응답에 신규 필드(`bookmarked`, `bookmarkCount`)를 추가하고, 최근 본 매물 조회 API(`GET /api/listings/recent`)를 신규 제공한다. 프론트는 다음 4가지에 대응한다.

1. **실거래가(Market) 상세 북마크 버그 수정**: `MarketProperty`에는 북마크 필드가 없어 [MarketDetailPanel.vue](src/components/market/MarketDetailPanel.vue:21)에서 `bookmarked` ref가 항상 `false`로 시작 → 이미 북마크한 실거래가도 상세 진입 시 "북마크" 상태로 보이는 버그. 응답 필드 `bookmarked: boolean`을 받아 초기화하도록 수정.
2. **조회수(viewCount)**: 이미 [types/listing.ts:28](src/types/listing.ts:28), [ListingDetailView.vue:185](src/views/ListingDetailView.vue:185), [ListingDetailPanel.vue:246](src/components/listing/ListingDetailPanel.vue:246)에 구현/표시되어 있음 → **추가 작업 불필요**, 회귀 확인만.
3. **북마크수(bookmarkCount)**: `Listing` 상세 응답에 `bookmarkCount: number` 추가 → 매물 상세(웹뷰 [ListingDetailView.vue](src/views/ListingDetailView.vue), 패널 [ListingDetailPanel.vue](src/components/listing/ListingDetailPanel.vue))의 북마크 버튼 옆에 숫자 표시.
4. **최근 본 매물**: `listingsApi`에 `getRecent()` 추가 (`GET /api/listings/recent`), 마이페이지 북마크 화면([MyBookmarksView.vue](src/views/my/MyBookmarksView.vue))에 "최근 본" 탭을 추가해 목록 노출.

사용자 확인 사항(결정됨):
- `bookmarked` 필드는 **MarketProperty에만 신규 추가**. Listing의 기존 `isBookmarked` 필드명은 변경하지 않음.
- `bookmarkCount`는 **매물(Listing) 상세에만** 표시.
- "최근 본 매물"은 **마이페이지에 탭 추가** (홈 화면 섹션 아님).

## Acceptance Criteria

- [ ] `MarketProperty` 타입에 `bookmarked?: boolean` 필드가 추가된다 ([src/types/market.ts](src/types/market.ts:4-19)).
- [ ] `MarketDetailPanel.vue`의 `fetchDetail()`에서 `bookmarked.value = res.data.data.bookmarked ?? false`로 초기화되어, 이미 북마크한 실거래가를 다시 조회하면 북마크 버튼이 "저장됨" 상태로 렌더링된다.
- [ ] `Listing` 타입에 `bookmarkCount: number` 필드가 추가된다 ([src/types/listing.ts](src/types/listing.ts:12-33)).
- [ ] `ListingDetailView.vue`와 `ListingDetailPanel.vue`의 북마크 버튼 옆에 북마크 수가 표시된다 (예: `저장됨 · 12`형태 또는 버튼 옆 별도 텍스트).
- [ ] `listingsApi`에 `getRecent: () => client.get<ApiResponse<Listing[]>>('/api/listings/recent', { headers: userIdHeader() })`가 추가된다 ([src/api/listings.ts](src/api/listings.ts:5-48), `getBookmarks` 패턴과 동일).
- [ ] `MyBookmarksView.vue`에 `'recent'` 탭이 추가되어 최근 본 매물 목록을 같은 카드 레이아웃(이미지/제목/가격/주소)으로 표시한다. 빈 상태 문구("최근 본 매물이 없습니다")도 포함한다.
- [ ] 조회수는 변경 없이 정상 표시되는지 회귀 확인 (`listing.viewCount` 그대로 노출).
- [ ] `npx vue-tsc --noEmit -p tsconfig.json` 타입 에러 없음.

## Implementation Steps

### 1. Market 북마크 버그 수정
- [src/types/market.ts:4](src/types/market.ts:4) `MarketProperty` 인터페이스에 `bookmarked?: boolean` 추가.
- [src/components/market/MarketDetailPanel.vue:44-53](src/components/market/MarketDetailPanel.vue:44) `fetchDetail()` 내부에 `bookmarked.value = res.data.data.bookmarked ?? false` 추가.
- `toggleBookmark()` ([MarketDetailPanel.vue:55-73](src/components/market/MarketDetailPanel.vue:55))는 로컬 상태 토글만 하므로 변경 불필요.

### 2. Listing 북마크수 표시
- [src/types/listing.ts:28](src/types/listing.ts:28) 근처에 `bookmarkCount: number` 추가.
- [src/components/ui/BookmarkButton.vue](src/components/ui/BookmarkButton.vue) 옆에 카운트를 보여줄지, 별도 `<span>`으로 분리할지 결정 — `BookmarkButton`은 여러 곳(Market, Listing)에서 공용으로 쓰이므로 **컴포넌트는 그대로 두고 호출부에서 카운트를 별도 표시**한다.
  - [ListingDetailView.vue:170](src/views/ListingDetailView.vue:170) `<BookmarkButton .../>` 옆에 `<span>{{ listing.bookmarkCount }}</span>` 추가.
  - [ListingDetailPanel.vue:235](src/components/listing/ListingDetailPanel.vue:235) 동일 패턴 적용.
- 토글 시 카운트 낙관적 업데이트: `toggleBookmark()`에서 북마크 시 `+1`, 해제 시 `-1` 처리 ([ListingDetailView.vue:48-65](src/views/ListingDetailView.vue:48), [ListingDetailPanel.vue:108-118](src/components/listing/ListingDetailPanel.vue:108)).

### 3. 최근 본 매물 API
- [src/api/listings.ts:43](src/api/listings.ts:43) `getBookmarks` 바로 아래에 추가:
  ```ts
  getRecent: () =>
    client.get<ApiResponse<Listing[]>>('/api/listings/recent', { headers: userIdHeader() }),
  ```

### 4. 최근 본 매물 UI (마이페이지 탭)
- [src/views/my/MyBookmarksView.vue](src/views/my/MyBookmarksView.vue) 수정:
  - `Tab` 타입에 `'recent'` 추가 ([line 12](src/views/my/MyBookmarksView.vue:12)).
  - `recentListings` ref, `fetchRecentListings()` 함수 추가 (listing 북마크 fetch 패턴과 동일, [line 21-32](src/views/my/MyBookmarksView.vue:21) 참고).
  - `switchTab()`에 `'recent'` 분기 추가 ([line 47-56](src/views/my/MyBookmarksView.vue:47)).
  - 탭 버튼 배열에 `['recent', '최근 본']` 추가 ([line 99](src/views/my/MyBookmarksView.vue:99)).
  - 최근 본 목록은 북마크 삭제 버튼 없이 동일 카드 레이아웃으로 렌더링 (북마크 탭 템플릿 [line 120-152](src/views/my/MyBookmarksView.vue:120) 복제 후 삭제 버튼 제거, 빈 상태 문구만 "최근 본 매물이 없습니다"로 변경).

## Risks and Mitigations

- **백엔드 필드명 불일치 위험**: 백엔드가 실제로 `bookmarked`가 아닌 다른 이름으로 내려줄 경우 타입 불일치. → PR 시 실제 응답 페이로드로 1회 확인, 안되면 `?? false` 옵셔널 체이닝으로 안전하게 처리되어 있어 런타임 깨짐은 없음.
- **북마크수 음수화**: 토글 낙관적 업데이트 중 빠른 연속 클릭 시 카운트가 실제 서버 값과 어긋날 수 있음 → 버튼에 `disabled` 처리(이미 `bookmarkLoading`으로 존재)로 중복 클릭 방지.
- **최근 본 매물 응답 형식 불일치**: `Listing[]` 단순 배열이 아니라 페이지네이션 객체로 내려올 가능성 → 1차로 `getBookmarks`와 동일한 단순 배열 형식으로 가정, 실제 응답 확인 후 필요시 `ListingPageResponse<Listing>`로 조정.

## Verification Steps

1. `npx vue-tsc --noEmit -p tsconfig.json` 통과 확인.
2. 실거래가 상세에서 북마크 후 다른 매물로 이동 → 다시 돌아왔을 때(또는 새로고침) "저장됨" 상태로 보이는지 확인 (백엔드 응답에 `bookmarked: true`가 와야 함, 실제 API 연동 전엔 mock으로 확인).
3. 매물 상세에서 북마크 수가 버튼 옆에 보이고, 토글 시 ±1 되는지 확인.
4. 마이페이지 → 북마크 → "최근 본" 탭 클릭 시 목록이 로드되는지 확인 (`/api/listings/recent` 404 시 에러 상태 정상 표시되는지).
5. 조회수가 기존과 동일하게 매물 상세에 표시되는지 회귀 확인.

## Changelog
- 최초 작성 (direct mode, 사용자 확인 3건 반영: Market 전용 bookmarked 필드, Listing 전용 bookmarkCount, 마이페이지 탭 방식 최근 본 매물)
