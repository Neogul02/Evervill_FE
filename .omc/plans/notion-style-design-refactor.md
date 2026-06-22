# Evervill 디자인 전체 리팩토링 — Notion 스타일 적용 (메인 그린 유지)

Status: **pending approval**

## Requirements Summary

- 기존 메인 컬러(`--color-accent: #429F80`, Evervill Green)는 구조적 액션(CTA, 활성 필터, 링크)의 단일 색으로 유지한다.
- Notion 디자인 시스템([DESIGN-notion.md](DESIGN-notion.md))의 사용 방식(warm canvas, ink 스케일, hairline, pill CTA vs 8px utility 버튼, 타이트한 타이포 트래킹, 레이어드 micro-shadow)을 응용한다. `src/style.css:7-36`에 이미 Notion식 토큰(`--color-canvas-soft`, `--color-ink*`, `--color-hairline`)이 부분 도입되어 있으므로 이를 완성한다.
- 사용자 확인 사항(질문 응답 반영):
  1. **악센트 컬러**: 그린을 구조색으로 유지하되, Notion 메인 컬러 팔레트를 응용한 보조 악센트를 배지/카테고리 구분에 추가로 도입한다 (장식 전용, CTA에는 사용 금지).
  2. **구현 방식**: 재사용 가능한 공통 컴포넌트(`BaseButton`, `IconButton`, `Badge` 등)를 신설한다.
- 기능 변경 없음 — 모든 인터랙션/데이터 흐름 유지, 스타일과 반응속도(피드백)만 개선.
- 모바일(≤640px 기준) / 데스크톱 2종 반응형 대응. 현재 `src/views/HomeView.vue:21`, `src/views/MarketView.vue:19`의 `w-110` 고정 사이드바 + `flex-1` 2-pane 레이아웃은 모바일에서 전혀 대응되지 않음 — 이것이 최우선 반응형 이슈.
- 북마크(이모지 `★/☆`), 아이콘(인라인 SVG), 버튼/배지 스타일·여백 통일.

## Current State Findings (codebase facts)

- **토큰**: `src/style.css:7-36` — accent green 계열, canvas, ink 4단계, hairline, 다크모드 토큰까지 정의됨. 악센트 보조 컬러·spacing/radius 스케일 토큰은 없음(`px-2.5/px-3/px-4/px-6`, `py-1/1.5/2.5/3` 등이 파일마다 임의 조합).
- **불일치 사례**:
  - `src/components/market/MarketFilterBar.vue:74-78` 건물유형 필터의 active 상태가 `bg-ink text-canvas`로, 그 외 모든 필터칩(`FilterBar.vue:60-65`, 가격 필터 등)의 `bg-accent text-white`와 다름 — 동일 컴포넌트 패턴인데 색상만 어긋남.
  - 매물 상태/거래유형 배지 색이 화면마다 다른 매핑을 씀: `ListingCard.vue:44-51`(orange/green/accent-light), `MarketCard.vue:15-19`(blue/green/orange) — 동일한 `dealType` 값(SALE/JEONSE/MONTHLY_RENT)에 서로 다른 색을 매핑하고 있어 사용자가 두 화면을 오가면 의미가 바뀐 것처럼 보임.
  - 북마크 토글은 이모지 `★ 저장됨 / ☆ 북마크` (`ListingDetailPanel.vue:147`)이고, 나머지 아이콘(다크모드 토글 `AppHeader.vue:116-125`, AI 분석 lightbulb/spinner `ListingDetailPanel.vue:236-248`, 페이지네이션 화살표)은 인라인 SVG — `lucide-vue-next`가 `package.json`에 설치돼 있지만 어디서도 import되지 않음.
  - 버튼 padding/radius가 파일마다 미세하게 다름: pill 버튼은 `px-3 py-1`(필터칩) vs `px-4 py-1.5`(주요 액션) vs `px-3 py-1.5`(AppHeader 로그인) — 의도적 계층이 아니라 산발적 차이.
  - `AppHeader.vue`는 `sm:` 브레이크포인트로 일부 링크만 숨기고(72,76,88,95), 모바일에서 검색창·로고·링크가 한 줄에 모두 끼어 깨질 가능성이 높음. 햄버거 메뉴 없음.
  - `HomeView.vue`/`MarketView.vue`는 `flex` 2-pane 고정 레이아웃(목록 `w-110` + 상세 `flex-1`)이라 모바일에서 두 패널이 동시에 좁게 눌림 — 모바일 전용 단일 패널 전환 로직 없음.
  - `useBreakpoint`/`useMediaQuery` 미사용 (`@vueuse/core`는 설치돼 있음).

## Design Decisions

1. **컬러 토큰 확장** (`src/style.css`): 기존 accent/canvas/ink/hairline 유지. Notion 팔레트를 응용한 **보조 악센트 4종**(장식·분류 전용, CTA 금지)을 추가:
   - `--color-accent-sky` (#62aef0 계열 톤 조정), `--color-accent-amber`(주황 계열, 기존 orange-100 대체), `--color-accent-rose`(핑크/레드 계열), `--color-accent-violet`(보라 계열) — 각각 `-light`/`-dark` 변형 포함(다크모드 대응).
   - 이 4색을 거래유형(`SALE`/`JEONSE`/`MONTHLY_RENT`) + 매물상태(`ACTIVE`/`RESERVED`/`CLOSED`)에 **하나의 고정 매핑 테이블**로 정의해 `ListingCard`/`MarketCard`/`ListingDetailPanel` 등 전 화면에서 동일하게 재사용한다 (`src/constants/dealTypeColors.ts` 신설).
   - 그린(`accent`)은 CTA/활성 필터/포커스 링/주요 가격 강조에만 사용 — 배지 매핑에서 그린 단독 사용은 제거(현재 JEONSE가 accent-light를 쓰는 것도 통일 매핑으로 교체).
2. **Spacing/Radius 스케일 토큰화**: `@theme`에 `--spacing-xs(8px)/sm(12px)/md(16px)/lg(24px)` 및 `--radius-chip(9999px)/--radius-card(12px)/--radius-input(8px)` 정의. 기존 임의 `px-2.5/py-1` 조합을 공통 컴포넌트 내부로 캡슐화해 직접 노출되는 매직 넘버를 줄인다.
3. **공통 UI 컴포넌트 신설** (`src/components/ui/`):
   - `BaseButton.vue` — `variant: 'primary' | 'secondary' | 'utility'`, `size: 'sm' | 'md'`. primary=`bg-accent`, secondary=outline accent, utility=`rounded-md` 8px(나머지는 pill). 내부에 `active:scale-95` 프레스 피드백과 `transition` 고정.
   - `FilterChip.vue` — 현재 3곳(FilterBar, MarketFilterBar)에 중복된 토글 칩 패턴을 하나로. `active` prop만으로 그린 단일 활성색 적용 → `MarketFilterBar.vue:74-78`의 ink 불일치를 자동 해결.
   - `IconButton.vue` — 원형/사각 아이콘 버튼(다크모드 토글, 캐러셀 인디케이터, 페이지네이션 화살표 등), 고정 사이즈 `w-9 h-9`, 아이콘 `w-4 h-4` 고정.
   - `Badge.vue` — `tone` prop(green/sky/amber/rose/violet/neutral)으로 거래유형·상태 배지 통일.
   - `BookmarkButton.vue` — lucide `Bookmark`/`BookmarkCheck` 아이콘 + 텍스트, pill 버튼.
4. **아이콘 통일**: `lucide-vue-next` 도입. 교체 대상 — 북마크 이모지(`ListingDetailPanel.vue:147`), 다크모드 토글 SVG(`AppHeader.vue:116-125`), AI 분석 lightbulb(`ListingDetailPanel.vue:236-238`)/spinner(`246-248`), 페이지네이션 화살표(`ListingListPanel.vue`). 모든 인터랙션 아이콘은 `w-4 h-4`(기본) / `w-3.5 h-3.5`(소형 캡션 옆) 두 단계로만 통일.
5. **반응형 전략** (모바일 ≤640px / 데스크톱 ≥768px, Tailwind 기본 `sm/md/lg` 사용, 신규 `useBreakpoint` 컴포저블로 JS 분기 필요한 곳만 보완):
   - `src/composables/useBreakpoint.ts` 신설 — `@vueuse/core`의 `useMediaQuery('(min-width: 768px)')` 래핑.
   - `HomeView.vue`/`MarketView.vue`: 데스크톱은 기존 2-pane 유지, 모바일은 **목록 ↔ 상세 단일 패널 전환**(상세 선택 시 목록을 슬라이드 아웃하고 뒤로가기 버튼으로 복귀) — `selectedListingId`/`selectedPropertyId` 상태를 그대로 재사용, 표시 로직만 `useBreakpoint` 기반으로 분기.
   - `AppHeader.vue`: 768px 미만에서 중앙 검색창과 보조 nav 링크(`내매물/북마크/관리자/프로필`)를 햄버거 드롭다운으로 이동, 로고+로그인/메뉴 버튼만 상시 노출.
   - `FilterBar.vue`/`MarketFilterBar.vue`: 칩 영역을 모바일에서 가로 스크롤(`overflow-x-auto` + `flex-nowrap`)로 전환해 줄바꿈으로 세로 공간을 잡아먹지 않게 함(데스크톱은 기존 `flex-wrap` 유지).
   - 터치 타겟: 모든 버튼 최소 `h-9`(36px) 이상 유지, 모바일 전용 pill 버튼은 `py-2`로 확대.
6. **인터랙션 속도 개선**: 기존 `transition-colors` 위주에서 `active:scale-95`(이미 일부 적용)를 모든 클릭형 요소(필터칩, 카드, 토글)에 일관 적용, `transition-colors duration-150`로 통일(현재 `duration-200` 혼재) — "빠른 반응속도" 요구를 트랜지션 단축 + 즉시 시각 피드백으로 해결. 최근 커밋(`577cb2a` nav 클릭 피드백 개선)과 동일한 패턴을 전사 적용.

## Acceptance Criteria

- [ ] `src/style.css`에 보조 악센트 4색 + spacing/radius 토큰이 정의되고, 다크모드 변형이 모두 존재한다.
- [ ] `src/constants/dealTypeColors.ts`가 존재하고 `ListingCard.vue`, `MarketCard.vue`, `ListingDetailPanel.vue`, `MarketDetailPanel.vue`가 동일한 매핑을 import해서 쓴다 (각 파일에 하드코딩된 색 분기 제거).
- [ ] `src/components/ui/{BaseButton,FilterChip,IconButton,Badge,BookmarkButton}.vue` 5개 컴포넌트가 생성되고, `FilterBar.vue`, `MarketFilterBar.vue`, `ListingDetailPanel.vue`, `AppHeader.vue`, `ListingListPanel.vue`, `MarketListPanel.vue`가 이를 사용해 버튼/배지 마크업을 직접 작성하지 않는다.
- [ ] `MarketFilterBar.vue`의 건물유형 필터 active 상태가 `bg-accent`(그린)로 통일되어 더 이상 `bg-ink`를 쓰지 않는다.
- [ ] 북마크 토글에 이모지(`★/☆`)가 남아있지 않고 lucide `Bookmark`/`BookmarkCheck` 아이콘을 사용한다.
- [ ] 모든 인라인 SVG 아이콘(다크모드 토글, AI 분석 lightbulb/spinner, 페이지네이션 화살표)이 `lucide-vue-next` 컴포넌트로 교체된다.
- [ ] 768px 미만(모바일) 뷰포트에서 `HomeView`/`MarketView`가 목록과 상세를 동시에 좁게 표시하지 않고 단일 패널로 전환된다(목록 선택 → 상세 전체화면 → 뒤로가기로 목록 복귀).
- [ ] 768px 미만에서 `AppHeader`의 보조 nav 링크가 햄버거 메뉴로 접히고, 로고/검색/메뉴 버튼이 한 줄에서 겹치거나 잘리지 않는다.
- [ ] 모든 클릭 가능 요소의 `transition-colors` duration이 150ms로 통일되고 프레스 피드백(`active:scale-95`)이 누락된 필터칩/카드에도 적용된다.
- [ ] 기존 기능(필터링, 페이지네이션, 북마크 토글, AI 분석 실행, 채팅 이동, 다크모드 토글, 인증 분기)이 리팩토링 전과 동일하게 동작한다 — API 호출/이벤트 emit 시그니처 변경 없음.
- [ ] `yarn build` 성공, 콘솔 에러 없음.

## Implementation Steps

### Phase 1 — 토큰 & 공통 컴포넌트 기반
1. `src/style.css` — 보조 악센트 4색(sky/amber/rose/violet, 라이트+다크 변형), spacing/radius 토큰 추가. 기존 accent/canvas/ink는 그대로 유지.
2. `src/constants/dealTypeColors.ts` 신설 — `DEAL_TYPE_TONE: Record<DealType, BadgeTone>`, `STATUS_TONE: Record<ListingStatus, BadgeTone>` export.
3. `src/components/ui/Badge.vue`, `FilterChip.vue`, `BaseButton.vue`, `IconButton.vue`, `BookmarkButton.vue` 작성 — Notion 컴포넌트 명세(`button-primary`=pill+accent, `button-utility`=8px radius, `badge-pill`=eyebrow 타이포) 참고해 variant 정의.
4. `lucide-vue-next` 아이콘 매핑 확정(Bookmark, BookmarkCheck, Sun, Moon, Lightbulb, Loader2, ChevronLeft, ChevronRight, Menu, X, Search).

### Phase 2 — 필터바 / 카드 통일
5. `FilterBar.vue`, `MarketFilterBar.vue` — 버튼 마크업을 `FilterChip` 컴포넌트로 교체, 모바일 가로 스크롤 적용. `MarketFilterBar.vue:74-78`의 ink 활성색 제거.
6. `ListingCard.vue`, `MarketCard.vue` — 배지 마크업을 `Badge` + `dealTypeColors` 매핑으로 교체.

### Phase 3 — 상세 패널 / 헤더
7. `ListingDetailPanel.vue` — 북마크 버튼을 `BookmarkButton`으로 교체, AI 분석 영역 아이콘을 lucide로 교체, 채팅/로그인 버튼을 `BaseButton`으로 교체.
8. `MarketDetailPanel.vue` — 동일 톤의 버튼/배지 패턴 적용(현재 구조 확인 후 동일 컴포넌트 재사용).
9. `AppHeader.vue` — `useBreakpoint` 적용해 모바일 햄버거 메뉴 신설(검색은 메뉴 내부 또는 아이콘 토글로 이동), 다크모드 토글을 `IconButton` + lucide Sun/Moon으로 교체.
10. `ListingListPanel.vue`, `MarketListPanel.vue` — 페이지네이션 화살표를 lucide ChevronLeft/Right + `IconButton`으로, radius 불일치(`rounded` → pill) 수정.

### Phase 4 — 레이아웃 반응형
11. `src/composables/useBreakpoint.ts` 신설.
12. `HomeView.vue`, `MarketView.vue` — 모바일 단일 패널 전환 로직 추가(목록/상세 토글, 뒤로가기 버튼).

### Phase 5 — 마무리
13. 전체 `transition-colors duration-200` → `duration-150` 일괄 정리, 누락된 `active:scale-95` 보강.
14. `yarn build` 및 다크모드 토글 포함 수동 스모크 테스트.

## Risks and Mitigations

- **위험**: 배지 컬러 매핑 통일 시 기존 사용자가 익숙해진 화면별 색(예: MarketCard의 SALE=blue)이 바뀜 → 시각적 회귀로 느껴질 수 있음.
  **완화**: 매핑 변경을 PR 설명에 명시하고, 그린은 건드리지 않으므로 브랜드 색 정체성은 유지됨을 확인.
- **위험**: 모바일 단일 패널 전환 로직이 `selectedListingId` 상태와 라우팅을 건드리면 기존 `route.query.address` 동기화(`FilterBar.vue:49-51`)가 깨질 수 있음.
  **완화**: 상태/라우팅 로직은 변경하지 않고 순수 표시(`v-if`/`v-show`) 분기만 추가.
- **위험**: `lucide-vue-next` 트리쉐이킹 미흡 시 번들 사이즈 증가.
  **완화**: named import만 사용(`import { Bookmark } from 'lucide-vue-next'`), 빌드 후 사이즈 확인.
- **위험**: 공통 컴포넌트 추출 중 prop 누락으로 일부 화면에서 disabled/active 상태가 시각적으로 깨질 수 있음(AI 분석 버튼의 `disabled` 등).
  **완화**: 각 교체 지점마다 기존 `:class`/`:disabled` 바인딩을 컴포넌트 prop으로 1:1 매핑 후 화면별 수동 확인.

## Verification Steps

1. `yarn build` 성공 확인.
2. 데스크톱(1280px) / 태블릿(800px) / 모바일(390px) 3가지 뷰포트에서 HomeView, MarketView, ListingDetailPanel을 직접 열어 레이아웃 깨짐 여부 확인.
3. 다크모드 토글 → 모든 신규 컴포넌트(Badge, FilterChip, IconButton)가 다크 토큰으로 정상 전환되는지 확인.
4. 북마크 토글, AI 분석 실행, 필터 변경, 페이지네이션, 채팅 이동(로그인/비로그인 분기) 기능을 각각 1회 이상 클릭해 기존과 동일하게 동작하는지 확인.
5. `MarketFilterBar`에서 건물유형 칩 클릭 시 그린 활성색으로 보이는지 확인(기존 ink 색상 미노출).

## Changelog

- Direct-mode 플랜 — 사용자 답변 반영: 그린 단일 구조색 유지 + Notion 팔레트 응용 보조 악센트 추가, 공통 UI 컴포넌트 신설 방식 채택.
