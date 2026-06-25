# 프론트엔드 UI/UX 기술 적용 정리

> Evervill 프론트엔드에서 사용자 경험(체감 속도, 인터랙션 피드백, 상태 일관성)을 위해 적용한 기술/패턴을 정리한다. 각 항목에 실제 구현 파일과 동작 방식을 함께 기술했다. 설치되어 있으나 실제로는 아직 적용되지 않은 항목도 정확성을 위해 구분해 표기한다.

## 1. 라우트 단위 코드 스플리팅 (Lazy Loading)

**위치**: `src/router/index.ts`

모든 라우트 컴포넌트를 `() => import('@/views/...')` 동적 임포트로 선언해, 초기 진입 시 전체 페이지 번들을 한 번에 받지 않고 라우트 전환 시점에 필요한 청크만 가져온다(Vite/Rollup 코드 스플리팅). 예외적으로 `/`(홈)과 `/listings/:id`(매물 상세)는 **같은 컴포넌트 참조(`HomeView`)를 공유**하도록 미리 변수로 추출해 둔다 — 두 라우트가 서로 다른 동적 임포트 함수를 쓰면 Vue Router가 다른 컴포넌트로 인식해 라우트 전환마다 컴포넌트를 통째로 리마운트(스크롤 위치/상태 초기화)하기 때문이다. 또한 `/api-test` 라우트는 `import.meta.env.DEV`로 감싸 프로덕션 빌드 결과물에서 완전히 제외한다(번들 크기 최적화).

## 2. 이미지 지연 로딩 (Lazy Loading)

**위치**: `ListingCard.vue`, `ListingDetailPanel.vue`, `MarketDetailPanel.vue`, `MarketListPanel.vue`, `DealerMatchModal.vue`, `DealerOffersView.vue`, `MyBookmarksView.vue`, `MyListingsView.vue`, `RecentListingsView.vue` 등 이미지를 렌더링하는 모든 컴포넌트

`<img loading="lazy" decoding="async">` 속성을 일관되게 사용해, 뷰포트에 들어오기 전인 이미지는 네트워크 요청 자체를 보류하고(`loading="lazy"`), 디코딩도 메인 스레드를 막지 않게(`decoding="async"`) 한다. 매물 카드가 한 페이지에 수십 개씩 나열되는 목록 화면에서 초기 페인트 비용을 줄이는 목적.

## 3. 페이지 전환 진행률 바 (Progress Bar)

**위치**: `src/composables/useNavProgress.ts`, `src/components/layout/NavProgressBar.vue`, `src/router/index.ts`

라우터의 `beforeEach`/`afterEach`/`onError` 훅에 연동된 전역 진행률 바(YouTube/GitHub 스타일 상단 바). 동작 원리:
- `router.beforeEach`에서 라우트 이름이 바뀔 때만 `start()` 호출 → `progress`를 20%로 세팅하고 100ms 간격으로 `progress += (85 - progress) * 0.15` 완화 함수(ease-out 근사)를 적용해 85%까지 천천히 채워진다. 실제 도착 시점을 모르기 때문에 85%에서 멈춰 "거의 다 됐다"는 인상만 준다.
- `router.afterEach`에서 `finish()`가 호출되어 즉시 100%로 채운 뒤 200ms 후 바를 숨기고 초기화한다.
- `router.onError`에서도 동일하게 `finish()`를 호출해 네비게이션이 실패해도 바가 영구히 남아있지 않게 한다.
- 상태(`active`, `progress`)는 모듈 스코프 싱글톤이라 앱 전체에서 `NavProgressBar.vue` 하나만 렌더링하면 된다.

## 4. 서버 상태 관리 — TanStack Vue Query

**위치**: `src/main.ts`(`app.use(VueQueryPlugin)`), 패키지: `@tanstack/vue-query`

React Query의 Vue 포트인 `@tanstack/vue-query`를 의존성에 추가하고 앱 전역 플러그인으로 등록해 캐싱/리페칭 인프라를 깔아둔 상태다. **다만 현재 시점에는 `useQuery`/`useMutation` 훅을 실제로 호출하는 화면이 아직 없고**, 데이터 패칭은 아래 4번 항목(`useAsyncAction`)과 컴포넌트 내부의 `async/await` + `ref` 조합으로 처리되고 있다. 즉 react-query 스타일의 선언적 서버 상태 캐싱은 인프라만 준비된 상태이며, 차후 매물 목록/실거래가 등 캐시 적중률이 중요한 화면에 단계적으로 도입하기 좋은 지점으로 남아 있다.

## 5. 공통 비동기 액션 처리 (`useAsyncAction`)

**위치**: `src/composables/useAsyncAction.ts`

`loading` ref를 토글하는 보일러플레이트를 감싸는 경량 컴포저블. `const { loading, run } = useAsyncAction()` 후 `run(() => api.getX())` 형태로 호출하면 호출 전후로 `loading`을 자동 on/off 한다. 에러 처리는 의도적으로 컴포저블 내부에서 삼키지 않고 `run(...).catch(...)` 형태로 호출부에 위임해, 화면마다 다른 에러 UI(인라인 메시지 vs 전역 에러 페이지)를 그대로 표현할 수 있게 했다. `DealerOffersView.vue` 등 목록 화면 전반에서 로딩 스피너 표시에 사용된다.

## 6. 검색/필터 입력 디바운스

**위치**: `src/composables/useDebouncedWatch.ts`, 사용처: `FilterBar.vue`(매물 검색), `MarketFilterBar.vue`(실거래가 검색)

키워드 입력처럼 타이핑마다 API를 호출하면 안 되는 필드에 한정해 디바운스를 적용한다. `watch(source, ...)`를 감싸 값이 바뀐 뒤 지정 시간(기본 400ms) 동안 추가 변경이 없을 때만 콜백을 1회 실행한다. 드롭다운형 필터(거래유형, 가격대, 연/월 등)는 즉시 반영하되, 자유 텍스트 키워드 입력만 디바운스를 적용해 "입력 중 깜빡임"과 "과도한 요청"을 동시에 방지한다.

## 7. 반응형 분기 (Breakpoint 감지)

**위치**: `src/composables/useBreakpoint.ts` (`@vueuse/core`의 `useMediaQuery` 래핑)

`min-width: 768px` 미디어쿼리를 reactive ref(`isDesktop`)로 노출해, 데스크톱/모바일에서 다른 레이아웃(예: 사이드 패널 vs 풀스크린 모달)을 렌더링해야 하는 컴포넌트가 CSS 미디어쿼리만으로 표현하기 어려운 분기(JS 로직 자체를 다르게 태우는 경우)를 처리한다.

## 8. 다크모드

**위치**: `src/composables/useTheme.ts`

- 최초 진입 시 `localStorage`에 저장된 사용자 선택이 있으면 그것을 우선 적용하고, 없으면 OS의 `prefers-color-scheme`을 따른다.
- OS 설정이 바뀌는 것도 `matchMedia(...).addEventListener('change', ...)`로 실시간 감지하되, **사용자가 명시적으로 토글을 선택한 적이 있으면**(localStorage에 값이 있으면) OS 변경을 더 이상 따라가지 않도록 분기한다 — 사용자의 명시적 선택이 시스템 기본값보다 우선한다는 원칙.
- 적용은 `document.documentElement.classList.toggle('dark', ...)`로 처리해 Tailwind의 `dark:` variant가 그대로 동작한다.

## 9. Toast 알림 시스템

**위치**: `src/composables/useToast.ts`, `src/components/ui/ToastContainer.vue`

모듈 스코프 싱글톤 큐(`toasts` ref)에 토스트를 push하고 일정 시간(기본 4초) 후 자동 제거하는 전역 알림 시스템. `ToastContainer.vue`는 `Teleport`로 `body` 최상단에 고정되고, `TransitionGroup`으로 등장(우측에서 슬라이드+페이드 인)/퇴장(페이드 아웃) 애니메이션을 적용한다. 실시간 채팅 메시지 수신 시(`useChat.ts`) 현재 보고 있지 않은 채팅방의 새 메시지를 토스트로 띄우고, 클릭하면 해당 채팅방으로 라우팅한다.

## 10. Promise 기반 확인 모달 (`useConfirmModal`)

**위치**: `src/composables/useConfirmModal.ts`, `src/components/ui/ConfirmModal.vue`

브라우저 기본 `confirm()`을 대체하는 디자인 시스템 일관 모달. `await useConfirmModal().open({ title, message, confirmText, danger })`로 호출하면 `Promise<boolean>`을 반환해, `if (!ok) return` 형태로 동기 코드처럼 분기할 수 있다. 내부적으로 모듈 스코프 `resolveFn`을 보관했다가 사용자가 확인/취소를 누르는 시점에 `resolve`를 호출하는 구조이며, 앱 전체에서 `App.vue`에 단 하나의 인스턴스만 마운트한다. 매물 신고, 딜러 제안 수락/취소 등 "되돌리기 어려운 동작"의 2차 확인에 일관되게 사용된다.

## 11. 모달 등장 애니메이션 공통 패턴

**위치**: `ConfirmModal.vue`, `DealerMatchModal.vue`, `OfferModal.vue` 등 Teleport 기반 모달 전반

모든 모달이 동일한 인터랙션 패턴을 공유한다.
- `Teleport to="body"`로 z-index 스태킹 문제를 피하고,
- 마운트 직후 150ms 동안 백드롭 클릭을 무시(`backdropReady`)한다 — 모달을 여는 클릭 이벤트가 버블링되어 같은 틱에 백드롭 클릭으로 인식되며 모달이 열리자마자 닫히는 버그를 방지,
- 패널 자체는 `scale(0.9) → scale(1)` + `opacity 0 → 1` 220ms `cubic-bezier(0.34, 1.56, 0.64, 1)`(살짝 오버슈트하는 "팝" 느낌) 애니메이션으로 등장,
- `Escape` 키 리스너와 `document.body.style.overflow = 'hidden'`(배경 스크롤 잠금)을 마운트/언마운트 시점에 등록·해제한다.

## 12. 리스트/디테일 전환 애니메이션 (animejs)

**위치**: `ListingListPanel.vue`, `MarketListPanel.vue`(목록), `ListingDetailPanel.vue`, `MarketDetailPanel.vue`(상세) — `animejs`의 `animate`/`stagger` 사용

- **목록 카드**: Vue의 `<TransitionGroup>` 커스텀 JS 훅(`onCardEnter`/`onCardLeave`)에서 `animejs`를 직접 호출한다. 진입 시 `translateY: [16, 0]`, `opacity: [0, 1]`을 300ms `outCubic`으로 적용하면서 `stagger(35)`로 카드마다 35ms씩 순차 지연시켜, 필터링/페이지 전환 시 카드가 한 번에 튀어나오지 않고 계단식으로 나타나는 효과를 만든다. 퇴장은 150ms 페이드아웃만 적용해 더 빠르게 사라지게 한다(체감상 "들어올 때는 보여주고, 나갈 때는 빠르게 치운다").
- **상세 패널**: 매물/실거래가를 바꿔가며 볼 때 패널 콘텐츠가 200ms `outCubic` 페이드인되어, 데이터가 즉시 바뀌어 보이는 끊김 대신 부드러운 전환을 준다.

## 13. 실시간 채팅 (STOMP over WebSocket)

**위치**: `src/composables/useChat.ts` (`@stomp/stompjs` + `sockjs-client`)

- 앱 전역에서 WebSocket 연결을 단 한 번만 맺는 싱글톤 구조(모듈 스코프 `stompClient`, `subscriptions` Map). 로그인 시 `/api/ws?token=...`로 연결하고, 연결 성공 시 사용자의 모든 채팅방을 한 번에 구독한다.
- 메시지 수신 시(`/topic/chat/{roomId}`) 현재 그 방을 보고 있지 않은 경우에만 안읽음 카운트 증가 + 토스트 알림을 트리거한다(9, 14번 항목과 연동) — 보고 있는 방의 메시지는 화면에 바로 그려지므로 중복 알림을 막는다.
- `reconnectDelay: 5000`으로 연결이 끊겨도 5초마다 자동 재연결을 시도한다.

## 14. 안읽은 채팅 수 배지 (실시간 + 폴링 하이브리드)

**위치**: `src/composables/useUnreadChatCount.ts`

네비게이션 바의 안읽음 배지를 두 가지 경로로 갱신한다 — (1) STOMP로 새 메시지가 오면 즉시 `incrementUnreadCount()`로 낙관적 증가, (2) 30초 간격 폴링(`startPolling`)으로 `chatApi.getRooms()`를 다시 호출해 실제 서버 상태와 동기화(`syncUnreadCountFromRooms`). 실시간 푸시만 믿지 않고 주기적 폴링으로 보정함으로써, 연결이 잠깐 끊겼다가 재연결되는 구간에서도 배지 숫자가 실제와 어긋나지 않게 한다.

## 15. 북마크 버튼 (즉각적 시각 피드백)

**위치**: `src/components/ui/BookmarkButton.vue`

북마크 여부에 따라 아이콘(`Bookmark`/`BookmarkCheck`)과 텍스트("북마크"/"저장됨"), 색상(테두리만 vs 강조색 채움)이 즉시 전환되는 단일 토글 버튼. `active:scale-95`로 탭 시 눌리는 느낌을 추가해 터치 디바이스에서의 피드백을 보강했다.

## 16. 페이지네이션(번호 기반) — 무한 스크롤 미적용

**위치**: `ListingListPanel.vue`, `MarketListPanel.vue`

매물/실거래가 목록은 무한 스크롤이 아니라 **페이지 번호 UI**(`pageNumbers` computed)로 구현되어 있다. 실거래가처럼 데이터량이 크고 "몇 페이지째인지" 사용자가 인지할 필요가 있는 목록 특성을 고려한 선택.

## 17. 인증 흐름의 UX 보강

**위치**: `src/api/client.ts`

- **Silent Refresh**: Access Token이 만료돼도 로그아웃되지 않고 인터셉터가 백그라운드에서 `/auth/reissue`를 호출해 토큰을 갈아치운 뒤 원래 요청을 재시도한다. 동시에 여러 요청이 401을 받아도 재발급 요청은 single-flight로 1회만 보낸다.
- **입력 보존형 에러 처리**: 회원가입, 딜러 가격 제안/수락/취소 요청은 전역 4xx/5xx 에러 페이지로 강제 이동시키지 않고 해당 폼/모달이 직접 에러 메시지를 인라인으로 보여주도록 예외 처리했다 — 실패해도 사용자가 입력 중이던 내용이 날아가지 않게 하기 위함.

## 18. 지도 시각화

**위치**: `src/components/map/NaverMap.vue`

Naver Maps를 매물 상세의 위치 표시에 사용한다(위도/경도 기반 마커).

## 19. (참고) 설치되어 있으나 미적용 상태인 라이브러리

문서의 정확성을 위해 명시한다 — 아래는 `package.json`에 의존성으로 존재하지만, 현재 코드베이스에서 실제로 import/호출되는 지점이 없다.

| 라이브러리 | 의도된 용도 | 현재 상태 |
|---|---|---|
| `@tanstack/vue-query` | 서버 상태 캐싱/리페칭(React Query의 Vue 버전) | 플러그인만 등록(`main.ts`), `useQuery`/`useMutation` 호출 없음 — 데이터 패칭은 `useAsyncAction` + 수동 `async/await`로 처리 중 |
| `vee-validate` / `zod` | 선언적 폼 검증/스키마 검증 | import 지점 없음 — 폼 검증(회원가입 등)은 각 컴포넌트에서 수동 조건문으로 처리 중 |
