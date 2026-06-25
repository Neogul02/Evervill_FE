# AI 등기부등본 분석 — 전용 nav 탭 + 대시보드 리디자인

> 상태: **pending approval** — 사용자의 명시적 실행 승인 전에는 코드를 작성하지 않는다.
> Direct 모드 계획 (요구사항이 충분히 구체적: nav 위치, 엔드포인트, 시각화 방향까지 확정됨). 2026-06-25 작성.

## 배경 — 이미 구현된 부분 확인됨

코드를 먼저 확인한 결과, 이 기능은 **이미 대부분 구현되어 있다**:

- [src/views/RegistryAnalysisView.vue](../../src/views/RegistryAnalysisView.vue) — 파일 업로드, `aiApi.analyzeRegistry()` 호출, 결과 표시, 이력 조회까지 전부 동작.
- [src/router/index.ts](../../src/router/index.ts):93-97 — `/ai/registry` 라우트가 `meta: { requiresAuth: true }`로 이미 등록되어 있음.
- [src/api/ai.ts](../../src/api/ai.ts):13-20 — `aiApi.analyzeRegistry(file)`가 정확히 사용자가 제시한 `POST /api/ai/analyses/registry` (multipart, `X-User-Id` 헤더, 응답 `{id, analysisType, targetId, fileUrl, riskLevel, resultSummary, createdAt}`)와 일치. **백엔드 연동은 끝난 상태.**
- [src/types/ai.ts](../../src/types/ai.ts):1-12 — `AnalysisType = 'PRICE' | 'REGISTRY'`, `RiskLevel = 'SAFE' | 'CAUTION' | 'DANGER'`, `AiAnalysis` 타입 모두 실제 응답과 일치.

**남은 일은 두 가지뿐이다:**
1. `/ai/registry`가 **nav에 연결되어 있지 않음** — [AppHeader.vue](../../src/components/layout/AppHeader.vue)에서 직접 들어갈 방법이 없고 URL을 알아야만 접근 가능.
2. 현재 화면은 가운데 정렬된 단일 카드(업로드 폼 → 결과 카드 → 이력 리스트)로, "전문적인 대시보드"로 보기엔 부족함 — 사용자가 선택한 방향(**위험도 히어로 + 통계 요약 카드**)으로 레이아웃을 재구성해야 한다.

이번 작업은 **새 백엔드 요청이 필요 없다** — 순수 프론트엔드 작업.

## 요구사항 요약

1. [AppHeader.vue](../../src/components/layout/AppHeader.vue)의 "공지사항" 옆에 "AI 분석" nav 탭 추가, 클릭 시 `/ai/registry`로 이동.
2. `RegistryAnalysisView.vue`를 대시보드 레이아웃으로 재구성:
   - **위험도 히어로 카드**: 가장 최근 분석 결과를 크게 강조 (아이콘 + 등급 라벨 + 한 줄 캡션 + 분석 시각), 분석 이력이 없으면 "첫 분석을 시작해보세요" 플레이스홀더.
   - **통계 요약 카드 3개**(그리드): 총 분석 건수 / 주의 등급 건수 / 위험 등급 건수 — `history` 배열에서 클라이언트 계산(서버 추가 호출 없음).
   - **2단 레이아웃**(데스크톱): 좌측에 업로드 폼 + 최신 결과 상세 패널, 우측에 통계 카드 + 이력 타임라인. 모바일은 세로 1단으로 자연스럽게 스택.
3. 백엔드 데이터는 `riskLevel`(enum)과 `resultSummary`(자유 텍스트)뿐이므로, **`resultSummary`를 파싱하지 않고** 하나의 텍스트 패널로 그대로 표시 (사용자가 확정한 방향).
4. 중복 제거: [ListingAiAnalysisCard.vue](../../src/components/listing/detail/ListingAiAnalysisCard.vue)와 `RegistryAnalysisView.vue`가 각자 `RiskLevel → 라벨/색상` 매핑을 따로 정의하고 있음(전자는 `Badge` 컴포넌트 사용, 후자는 하드코딩 클래스) — 공통 상수로 통합하고 두 곳 모두 `Badge` 컴포넌트로 통일.

## Implementation Steps

### 1. 공통 리스크 상수 추출 (중복 제거)
신규 [src/constants/aiRisk.ts](../../src/constants/aiRisk.ts):
```ts
import type { BadgeTone } from './dealTypeColors'
import type { RiskLevel } from '@/types/ai'

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = { SAFE: '안전', CAUTION: '주의', DANGER: '위험' }
export const RISK_LEVEL_TONE: Record<RiskLevel, BadgeTone> = { SAFE: 'green', CAUTION: 'amber', DANGER: 'rose' }
```
- [src/components/listing/detail/ListingAiAnalysisCard.vue](../../src/components/listing/detail/ListingAiAnalysisCard.vue):18-27의 로컬 `AI_LEVEL_TONE`/`AI_LEVEL_LABEL`을 제거하고 이 상수를 import해서 교체.
- `RegistryAnalysisView.vue`의 `RISK_LABEL`/`RISK_COLOR`(19-28줄, 하드코딩 색상 클래스)도 제거하고 동일 상수 + 기존 `Badge` 컴포넌트로 교체.

### 2. AppHeader.vue — nav 탭 추가
[src/components/layout/AppHeader.vue](../../src/components/layout/AppHeader.vue):85-89 (공지사항 링크) 바로 뒤에 동일 패턴으로 추가:
```vue
<RouterLink to="/ai/registry" class="nav-link font-semibold">AI 분석</RouterLink>
```
이 블록(73-90줄)은 `isDesktop` 분기 없이 항상 렌더링되므로 모바일용 별도 추가가 필요 없음(193-237줄의 모바일 드롭다운은 내매물/북마크 등 별도 메뉴이며 이 블록과 무관). `/ai/registry`는 이미 `requiresAuth: true`라 비로그인 클릭 시 기존 `beforeEach` 가드([src/router/index.ts](../../src/router/index.ts):139-153)가 `/login`으로 보내므로 추가 가드 불필요.

### 3. RegistryAnalysisView.vue — 대시보드 레이아웃 재작성
- 컨테이너를 `max-w-2xl`(현재 86줄)에서 `max-w-5xl`로 확장.
- 구조를 `grid md:grid-cols-[1fr_340px] gap-6`로 2단 분리:
  - **좌측**: 업로드 폼(기존 98-125줄 로직 유지) + 그 아래 "최신 분석 상세" 패널(기존 결과 카드를 더 큰 패널로, 아이콘 포함 — `ShieldCheck`/`ShieldAlert`/`ShieldX`(lucide) 매핑을 `RiskLevel`별로 추가).
  - **우측**: 통계 요약 카드 3개(세로 스택 또는 1행 그리드) + 이력 타임라인(기존 138-157줄 리스트를 우측 레일로 이동, 카드 폭이 좁아지므로 한 줄 요약으로 축약).
- 통계 계산은 컴포저블 분리 없이 `computed`로 간단히: `history.value.filter(a => a.riskLevel === 'CAUTION').length` 등 (서버 추가 호출 없음 — 기존 `aiApi.getMyAnalyses()` 결과 재사용).
- 히어로 카드: `history.value[0]`(최신순 정렬 가정 — 백엔드가 `createdAt` 내림차순으로 주는지 **확인 필요**, 아니면 FE에서 `createdAt` 기준 정렬) 또는 방금 제출한 `result.value`를 우선 표시.
- 페이지 헤더 타이포 강화(타이틀 크기/서브카피)와 카드 전반에 `shadow-sm`/구분선 등 기존 디자인 시스템 톤 유지(새 컬러/폰트 추가하지 않음 — 기존 `bg-canvas`, `border-hairline`, `text-ink` 등 토큰 재사용).

## Acceptance Criteria

- [ ] nav 데스크톱·모바일 모두에서 "공지사항" 옆에 "AI 분석" 탭이 보이고 클릭 시 `/ai/registry`로 이동한다.
- [ ] 비로그인 상태에서 "AI 분석" 클릭 시 `/login?redirect=/ai/registry`로 리다이렉트된다 (기존 가드 재사용 확인).
- [ ] `/ai/registry` 화면이 데스크톱에서 2단 레이아웃(좌: 업로드+상세, 우: 통계+이력)으로 보인다.
- [ ] 분석 이력이 없을 때 히어로 카드가 빈 상태 플레이스홀더를 보여준다 (에러 아님).
- [ ] 분석 실행 후 히어로 카드와 통계 요약(총 건수/주의/위험)이 새로고침 없이 즉시 갱신된다.
- [ ] `ListingAiAnalysisCard.vue`와 `RegistryAnalysisView.vue`가 동일한 `RISK_LEVEL_LABEL`/`RISK_LEVEL_TONE` 상수를 사용하고, 두 곳 모두 `Badge` 컴포넌트로 위험도를 표시한다 (하드코딩 색상 클래스 제거).
- [ ] 모바일 너비에서 2단 그리드가 1단으로 자연스럽게 스택되고 가로 스크롤이 생기지 않는다.

## Risks and Mitigations

| 리스크 | 완화 방안 |
|---|---|
| 히어로 카드용 "최신 분석"이 어떤 기준인지(서버 정렬 순서 불명) | `history`를 받은 뒤 FE에서 `createdAt` 기준 내림차순으로 명시적으로 정렬해 서버 정렬 순서에 의존하지 않음 |
| 통계 카드가 "전문적"으로 보이려면 시각적 완성도가 중요한데, 디자인 합의 없이 진행 시 재작업 위험 | 구현 후 브라우저로 직접 확인(로그인 → 파일 업로드 → 결과 확인)하고 스크린샷 기준으로 1차 검수, 필요시 톤 조정 |
| `resultSummary`가 매우 길 경우 상세 패널이 카드 톤을 깨뜻트릴 수 있음 | `max-h` + `overflow-y-auto`로 패널 높이 제한, 기존 `whitespace-pre-line` 유지 |
| 차트 라이브러리 미설치 상태에서 "대시보드"를 과도하게 시각화하려다 스코프가 커질 위험 | 사용자가 이미 "차트 없이 통계 요약 카드+배지"로 방향을 확정했으므로 신규 의존성 추가 없이 CSS/아이콘만으로 구현 |

## Verification Steps

1. `yarn build`로 타입/빌드 에러 없는지 확인.
2. 로그인 후 데스크톱 너비에서 nav의 "AI 분석" 클릭 → 2단 대시보드 레이아웃 확인.
3. PDF/이미지 파일 업로드 → 분석 실행 → 히어로 카드·통계 카드가 즉시 갱신되는지 확인.
4. 로그아웃 상태에서 "AI 분석" 클릭 → 로그인 페이지로 리다이렉트 확인.
5. 매물 상세 페이지의 `ListingAiAnalysisCard`가 기존과 동일하게 동작하는지(리스크 배지 라벨/색상 동일) 회귀 확인.
6. 모바일 너비(예: 375px)로 줌아웃/디바이스 툴바 확인 — 레이아웃이 1단으로 깨지지 않는지 확인.

## 미해결 결정 사항

1. 나중에 "AI 분석" nav 탭을 향후 `PRICE` 분석 등 다른 분석 타입까지 묶는 허브 페이지로 확장할지, 지금처럼 등기부등본 전용 페이지로 단일 링크 유지할지 — 이번 스코프는 후자로 진행하고 필요 시 별도 계획으로 분리.
