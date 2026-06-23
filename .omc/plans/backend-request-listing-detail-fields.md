# 백엔드 요청: 매물 상세 응답에 `sellerNickname`, `isBookmarked` 추가

## 배경
공유해주신 `GET /api/listings/{id}` 스키마를 프론트 타입과 대조해보니, 프론트 코드가 실제로는 응답에 없는 필드 3개(`sellerNickname`, `isBookmarked`, `city`/`district`/`neighborhood`)를 읽고 있던 게 발견됐습니다.

- `city`/`district`/`neighborhood`는 애초에 분리된 필드로 안 내려오는 게 맞아 보여서, 프론트에서 `address` 하나로만 표시하도록 고쳤습니다 (백엔드 변경 불필요).
- `sellerNickname`, `isBookmarked`는 마켓플레이스 기능상 있는 게 맞을 것 같아서, 백엔드에 추가를 요청드립니다.

## 요청 사항

**엔드포인트:** `GET /api/listings/{id}`

**추가했으면 하는 필드 2개:**
```json
{
  "data": {
    ...,
    "sellerNickname": "string | null",
    "isBookmarked": true
  }
}
```

1. **`sellerNickname`**: `sellerId`로 User 테이블 join해서 닉네임 내려주기. 매물 상세에서 "판매자: {sellerId}" 대신 닉네임을 보여주려고 합니다.
2. **`isBookmarked`**: 요청자가 이 매물을 북마크했는지 여부. **요청자 식별을 위해 프론트에서 이미 `X-User-Id` 헤더를 이 엔드포인트에 추가로 보내도록 변경했습니다** ([src/api/listings.ts](../../src/api/listings.ts) `getById`). 비로그인 상태면 헤더가 안 붙으니 그 경우 `isBookmarked: false`로 내려주시면 됩니다.

## 프론트 현황 (참고용, 이미 완료됨)
- [src/types/listing.ts](../../src/types/listing.ts): `Listing` 타입에서 존재하지 않던 `city`/`district`/`neighborhood` 필드 제거, `sellerNickname`/`isBookmarked`는 옵셔널(`?`)로 변경해서 백엔드가 아직 안 내려줘도 깨지지 않게 처리
- [src/components/listing/ListingDetailPanel.vue](../../src/components/listing/ListingDetailPanel.vue): 헤더의 지역 표시를 `city/district/neighborhood` 대신 `address`로 변경, 판매자 표시는 `sellerNickname ?? "판매자 #{sellerId}"`로 폴백 처리, 북마크 초기값은 `isBookmarked ?? false`로 안전 처리
- [src/views/ListingDetailView.vue](../../src/views/ListingDetailView.vue): 원래 북마크 상태를 API 응답에서 전혀 안 읽고 항상 `false`로 시작하던 버그도 같이 고쳐서 `isBookmarked ?? false`를 반영하도록 수정
- 위 두 필드가 추가되면 프론트는 추가 변경 없이 바로 정확한 값을 표시합니다.
