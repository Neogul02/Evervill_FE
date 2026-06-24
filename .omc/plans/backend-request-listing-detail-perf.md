# 백엔드 요청: 매물 상세(`GET /api/listings/{id}`) 일부 매물에서 2~3초 지연

## 배경
"특정 매물만 상세 페이지 로딩이 2~3초씩 걸린다"는 제보가 있어서, 프론트 코드 의심 구간(판매자 프로필 비동기 조회, `nearbyMarketPrices` 크기)을 먼저 검증했습니다. 결론적으로 **프론트 코드 문제가 아니라 `GET /api/listings/{id}` 응답 자체의 지연**으로 확인됐습니다.

## 검증 과정 (재현 가능)

1. **판매자 정보 조회가 렌더링을 막는지 확인** → 아님. [ListingDetailPanel.vue](../../src/components/listing/ListingDetailPanel.vue)의 `authApi.getPublicProfile()` 호출은 `await` 없이 `.then()`으로 fire-and-forget 처리되어 있어 상세 렌더링을 절대 막지 않습니다.
2. **`nearbyMarketPrices` 배열 크기와 응답 시간의 상관관계 확인** → 상관관계 없음. id=21은 `nearbyMarketPrices.length === 0`인데도 2.5~2.7초가 걸렸고, id=37은 같은 0인데 0.03초였습니다.
3. **캐시/워밍업 효과인지 확인** → 아님. 같은 id를 3회 연속 호출해도 시간이 일정했습니다 (id=7: 2.63s/2.73s/2.68s, id=37: 0.028s/0.042s/0.043s, id=21: 2.47s/2.67s/2.63s).

### 측정 데이터 (`curl -w "%{time_total}"`, `/api/listings/{id}` 각 1회)
| id | 응답시간 | nearbyMarketPrices 개수 |
|----|---------|------------------------|
| 7  | 2.76s | 4162 |
| 16 | 2.61s | 4592 |
| 21 | 2.60s | **0** |
| 23 | 1.68s | **0** |
| 28 | 0.04s | 0 |
| 31 | 0.03s | 0 |
| 37 | 0.03s | 0 |

→ id 7~27, 30은 일관되게 느리고, id 28, 31, 33~37은 일관되게 빠릅니다. **`nearbyMarketPrices` 크기와 무관하게 특정 매물 id 군에서만 느립니다.**

## 요청 사항
백엔드에서 `GET /api/listings/{id}` 핸들러(혹은 그 안에서 인근 실거래가를 찾는 거리 계산 쿼리)를 확인해주시면 좋겠습니다. 추정되는 원인:
- 매물의 `latitude`/`longitude`(또는 `address`) 값에 따라 인근 실거래가를 찾는 거리 계산 쿼리가 풀스캔이 되는 경우(공간 인덱스 미적용, 또는 특정 좌표 범위에서 인덱스를 못 타는 경우)
- 결과가 0건이어도 쿼리 자체(예: 반경 내 후보를 다 모은 뒤 필터링하는 방식)가 무거우면 위 패턴과 일치합니다.

## 프론트 측 대응 (참고용, 완료됨)
- 같은 작업에서 "인근 실거래가 비교" 테이블에 10개 단위 페이지네이션을 추가했습니다 ([ListingDetailPanel.vue](../../src/components/listing/ListingDetailPanel.vue) `nearbyMarketPaged`/`nearbyMarketPage`). 다만 이건 렌더링 개수만 줄이는 것이고, 위 지연은 데이터가 **이미 응답에 다 포함되어 도착한 뒤**의 일이라 페이지네이션과 무관하게 백엔드 응답 자체가 느립니다.
- 프론트에서 "매물 핵심 정보 먼저 렌더링 → 인근 실거래가 비동기 로드" 같은 분리를 하려면, `nearbyMarketPrices`를 매물 상세 응답에서 분리해 별도 엔드포인트(예: `GET /api/listings/{id}/nearby-market`)로 빼주셔야 가능합니다. 필요하시면 이 분리도 요청드릴 수 있습니다.
