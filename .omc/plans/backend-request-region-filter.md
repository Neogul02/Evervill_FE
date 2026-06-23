# 백엔드 요청: 매물/실거래가 지역별 필터 (`regions`)

## 배경
매물탭/실거래가탭에 지역 버튼 필터(서울, 수도권, 강원, 충청, 전라, 경상, 부울경, 제주)를 추가했습니다. "수도권"처럼 시/도 여러 개를 한 번에 묶는 버튼이 있어서, 기존 `keyword`/`address` 단일 문자열 검색과는 별개로 OR 조건의 배열 파라미터로 보내도록 만들었습니다.

## 요청 사항

**엔드포인트:** `GET /api/listings`, `GET /api/market` 둘 다 동일하게 적용

**추가할 쿼리 파라미터:**
- `regions` (string 배열, optional) — 여러 개 들어오면 OR로 묶여야 함

**전송 형식 (중요):** axios 기본 배열 직렬화(`regions[]=a&regions[]=b`)가 아니라, Spring `@RequestParam List<String> regions`가 바로 받을 수 있는 형태로 보내도록 프론트에서 커스텀 시리얼라이저를 적용했습니다:
```
GET /api/listings?regions=서울&regions=경기&regions=인천&...
```
(같은 키 `regions`가 반복되는 표준 query string. 컨트롤러에서 `@RequestParam(required = false) List<String> regions` 로 받으면 그대로 바인딩됩니다.)

**매칭 기준:**
- 매물(`/api/listings`): `address` 필드에 `regions` 배열 중 하나라도 포함(LIKE)되면 매칭 — `regions` 안의 각 값에 대해 OR
- 실거래가(`/api/market`): `districtName`(또는 동일 역할의 지역명 필드)에 같은 방식으로 OR 매칭

**예시 쿼리:**
```sql
-- regions=['서울','경기','인천'] 들어온 경우
WHERE (address LIKE '%서울%' OR address LIKE '%경기%' OR address LIKE '%인천%')
```
다른 필터(`dealType`, `minPrice` 등)와는 AND로 결합됩니다.

**버튼별 전송 값 (참고용, 프론트에 이미 하드코딩됨):**
| 버튼 | regions 값 |
|---|---|
| 전체 | (파라미터 자체를 안 보냄) |
| 서울 | `['서울']` |
| 수도권 | `['서울','경기','인천']` |
| 강원 | `['강원']` |
| 충청 | `['충청']` |
| 전라 | `['전라']` |
| 경상 | `['경상']` |
| 부울경 | `['부산','대구','울산']` |
| 제주 | `['제주']` |

`충청`/`전라`/`경상`은 "충청북도"/"충청남도"처럼 행정구역명에 공통 접두어가 있어서 단일 값으로도 두 도를 다 잡습니다. "부울경"(부산/울산/경남)은 행정구역명이 서로 다른 접두어라 3개 값을 배열로 보냅니다.

## 프론트 현황 (참고용, 이미 완료됨)
- [src/api/client.ts](../../src/api/client.ts): axios `paramsSerializer`를 커스텀해서 배열 파라미터를 `key=v1&key=v2` 형식(대괄호 없이)으로 직렬화하도록 변경 — 이번뿐 아니라 앞으로 배열 쿼리 파라미터를 쓰는 모든 API에 공통 적용됨
- [src/types/listing.ts](../../src/types/listing.ts), [src/types/market.ts](../../src/types/market.ts): `ListingFilter`/`MarketFilter`에 `regions?: string[]` 추가
- [src/components/listing/FilterBar.vue](../../src/components/listing/FilterBar.vue), [src/components/market/MarketFilterBar.vue](../../src/components/market/MarketFilterBar.vue): 지역 칩 UI 추가, 선택 시 `update` 이벤트에 `regions` 포함해 emit
- `ListingListPanel.vue`/`MarketListPanel.vue`가 필터 변경을 그대로 API 호출에 전달하는 기존 구조라, 백엔드가 파라미터를 받기 시작하면 추가 프론트 수정 없이 동작
