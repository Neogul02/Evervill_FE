# 백엔드 요청: 매물 목록(`/api/listings`) 등록 연/월 필터 추가

## 배경
프론트(Evervill_FE)에서 매물탭과 실거래가탭에 등록 연도/월 필터 UI를 추가했습니다.
- 실거래가(`/api/market`)는 이미 `dealYear`/`dealMonth` 쿼리 파라미터를 지원하고 있어 프론트만 UI를 노출하면 바로 동작합니다.
- 매물(`/api/listings`)에는 거래연월 개념이 없고 `createdAt`(등록일시, 예: `"2026-06-22T14:42:12"`)만 있어서, 이 필드를 기준으로 새 필터 파라미터가 필요합니다.

## 요청 사항

**엔드포인트:** `GET /api/listings`

**추가할 쿼리 파라미터 (둘 다 optional, 독립적으로 적용 가능):**
- `year` (number) — `createdAt`의 연도와 일치하는 매물만 반환
- `month` (number, 1~12) — `createdAt`의 월과 일치하는 매물만 반환

기존 파라미터(`dealType`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `address`, `keyword`, `page`, `size`)와 동일한 방식으로 AND 조건 결합되어야 합니다.

**동작 예시:**
- `year=2026` → 2026년에 등록된 매물 전체
- `year=2026&month=6` → 2026년 6월에 등록된 매물
- `month=6` (year 없이) → 연도 무관하게 6월에 등록된 매물 전체
- 둘 다 없으면 → 기존과 동일하게 필터 미적용

**구현 참고 (JPA 기준 예시):**
```java
// QueryDSL / JPQL 조건 추가
.and(year == null ? null : listing.createdAt.year().eq(year))
.and(month == null ? null : listing.createdAt.month().eq(month))
```
또는 인덱스 활용을 위해 범위 쿼리로 변환하는 방식도 가능합니다 (year/month로 해당 월의 시작/다음달 시작 시각을 계산해 `createdAt >= start AND createdAt < end`).

**페이지네이션 주의:**
응답의 `totalCount`/`hasNext`는 이 필터들이 적용된 결과 기준이어야 합니다 (다른 필터들과 동일).

**응답 포맷:** 변경 없음 (`ListingPageResponse` 그대로, 필터링된 `content`만 반영).

## 프론트 현황 (참고용, 이미 완료됨)
- [src/types/listing.ts](../../src/types/listing.ts)의 `ListingFilter`에 `year?: number`, `month?: number` 추가됨
- [src/components/listing/FilterBar.vue](../../src/components/listing/FilterBar.vue)에 연도(최근 11년)/월 선택 UI 추가, 변경 시 `update` 이벤트로 `year`/`month` 포함해 emit
- [src/components/listing/ListingListPanel.vue](../../src/components/listing/ListingListPanel.vue)가 필터 변경을 감지해 `listingsApi.getList({ ...filter, page })`로 그대로 전달 — 백엔드가 파라미터를 받기 시작하면 추가 프론트 수정 없이 바로 동작
