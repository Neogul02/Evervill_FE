# Evervill — 부동산 직거래 마켓플레이스 (Frontend)

전세/월세/매매 매물을 사용자 간 직거래로 등록·탐색·채팅 거래하고, 국토부 실거래가와 비교할 수 있는 부동산 마켓플레이스의 프론트엔드. 공인중개사가 매물에 중개 수수료(복비)를 미리 제안하는 "딜러 역경매"와 AI 기반 매물 가격/등기부등본 분석 기능을 포함한다.

> 기능 명세, 도메인 모델, DB 스키마는 [`docs/`](./docs) 디렉토리를 참고:
> - [`docs/requirements-specification.md`](./docs/requirements-specification.md) — 요구사항 정의서
> - [`docs/class-diagram.md`](./docs/class-diagram.md) — 클래스(도메인 모델) 다이어그램
> - [`docs/er-diagram.md`](./docs/er-diagram.md) — ER 다이어그램 (`ERD.ts` 베이스라인 + 변경분)

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Vue 3 (`<script setup>`, Composition API) + TypeScript |
| 빌드 도구 | Vite, `vue-tsc`로 타입 체크 후 빌드 |
| 라우팅 | Vue Router 5 (역할 기반 네비게이션 가드) |
| 상태관리 | Pinia (인증 스토어) |
| 서버 상태/캐싱 | `@tanstack/vue-query` |
| HTTP 클라이언트 | Axios (인터셉터로 인증/토큰 재발급/에러 라우팅 처리) |
| 실시간 통신 | `@stomp/stompjs` + `sockjs-client` (STOMP over WebSocket) |
| 스타일링 | Tailwind CSS 4 (디자인 토큰 기반, 다크모드 지원) |
| 폼 검증 | `vee-validate` + `zod` |
| 아이콘 | `lucide-vue-next` |
| 애니메이션 | `animejs` |
| 지도 | Naver Maps (`src/components/map/NaverMap.vue`) |

## 프로젝트 구조

```
src/
├── api/            # 백엔드 호출 모듈 (도메인별 1파일) — auth, listings, market, chat, ai, admin, notices, client
├── components/
│   ├── chat/       # 채팅 관련 컴포넌트 (딜러 매칭 모달 등)
│   ├── layout/      # 헤더, 네비게이션 진행바 등 전역 레이아웃
│   ├── listing/     # 매물 카드/목록/상세/필터/가격제안 모달 (detail/ 하위에 상세 전용 카드들)
│   ├── map/         # 지도 컴포넌트
│   ├── market/      # 실거래가 카드/목록/상세/필터
│   └── ui/          # 공용 UI 프리미티브 (Button, Badge, Modal, Toast 등)
├── composables/     # useChat, useConfirmModal, useToast, useAsyncAction 등 재사용 로직
├── constants/       # 색상/라벨 매핑 등 상수
├── router/          # 라우트 정의 + 인증/역할 가드
├── stores/          # Pinia 스토어 (auth)
├── types/           # 도메인 타입 정의 (도메인별 1파일)
├── utils/           # 포맷터(가격/면적/층 등), JWT 디코더
├── views/           # 페이지 단위 컴포넌트 (my/, error/ 하위 폴더 포함)
├── App.vue
├── main.ts
└── style.css        # Tailwind 진입점 + 디자인 토큰
```

### API 모듈 ↔ 백엔드 도메인 매핑

| 모듈 | 담당 도메인 |
|---|---|
| `api/auth.ts` | 회원가입(일반/공인중개사), 로그인, 토큰 재발급, 내 정보, 공개 프로필 |
| `api/admin.ts` | 공지 CRUD, 신고 처리, 실거래가 배치, 매물 강제삭제, 공인중개사 승인/거절 |
| `api/listings.ts` | 매물 CRUD, 이미지, 북마크, 최근 본 매물, 신고, **딜러 가격 제안(offers)** |
| `api/market.ts` | 국토부 실거래가 조회/북마크 |
| `api/chat.ts` | 채팅방/메시지, **딜러 제안 수락/취소** |
| `api/ai.ts` | AI 가격 분석, 등기부등본 분석, 분석 이력 |
| `api/notices.ts` | 공지/이벤트 공개 조회 |
| `api/client.ts` | Axios 인스턴스, 인증 헤더 헬퍼(`userIdHeader`/`dealerHeaders`), 인터셉터 |

## 시작하기

### 요구 사항
- Node.js (Vite 8 / vue-tsc 3 호환 버전)
- Yarn

### 설치 및 실행

```bash
yarn install
yarn dev       # http://localhost:3000 — vite.config.ts의 프록시로 /api, /auth, /oauth2 등을 백엔드 게이트웨이로 포워딩
yarn build     # vue-tsc -b 타입체크 후 vite build
yarn preview   # 빌드 결과 로컬 프리뷰
```

개발 모드에서는 `/api-test` 라우트(`src/views/ApiTestView.vue`)가 추가로 노출된다(프로덕션 빌드 미포함).

### 환경 변수

| 변수 | 설명 | `.env.development` | `.env.production` |
|---|---|---|---|
| `VITE_GATEWAY_URL` | OAuth2(카카오 로그인) 리다이렉트 시 사용하는 게이트웨이 베이스 URL | 빈 문자열(Vite 프록시가 `/oauth2/authorization`을 포워딩) | 실제 게이트웨이 주소 |

`/api`, `/auth`, `/api/ws`, `/oauth2/*`, `/login/oauth2/*` 경로는 개발 시 `vite.config.ts`의 `server.proxy`, 배포 시 `vercel.json`의 `rewrites`로 동일한 백엔드 게이트웨이로 전달된다.

## 아키텍처 노트

### 인증 & 인가
- 로그인 시 발급된 Access/Refresh 토큰을 `localStorage`에 저장. `authStore.user`는 **JWT를 직접 디코드**(`src/utils/jwt.ts`)해서 채워지며, 백엔드 응답의 `user` 객체를 신뢰하지 않는다 — 따라서 역할(role)이 바뀌면 재로그인(또는 토큰 재발급)이 필요하다.
- Access Token이 만료되면 `client.ts`의 응답 인터셉터가 자동으로 `/auth/reissue`를 호출해 재발급(silent refresh)한다. 동시에 여러 요청이 401을 받아도 재발급은 single-flight로 한 번만 실행된다.
- 일부 엔드포인트는 API 게이트웨이가 JWT에서 role을 자동으로 못 채워주므로, FE가 `X-User-Id`/`X-User-Role` 헤더를 직접 첨부한다(`userIdHeader()`/`dealerHeaders()` in `client.ts`). 관리자(`/api/admin/*`, `/auth/admin/*`) 엔드포인트는 게이트웨이가 role을 자동 채워줘 `X-User-Id`만 보내면 된다.
- 라우터 가드(`router/index.ts`)는 `meta.requiresAuth`/`requiresAdmin`/`requiresDealer`/`guestOnly`를 기준으로 로그인 페이지 또는 홈으로 리다이렉트한다.

### 에러 처리
- 4xx/5xx 응답은 기본적으로 전역 에러 페이지(`/error/4xx`, `/error/5xx`)로 라우팅된다(`GET` 요청과 AI 요청은 제외 — 컴포넌트에서 인라인 처리).
- 회원가입(`/auth/signup*`)과 딜러 가격 제안/수락/취소(`*/offers*`) 요청은 예외적으로 전역 에러 페이지로 보내지 않고, 해당 화면(폼/모달)이 직접 에러 메시지를 보여준다 — 실패해도 입력 중인 내용이 날아가지 않게 하기 위함.

### 실시간 채팅
- `useChat.ts`가 STOMP(WebSocket, SockJS 폴백)로 `/topic/chat/{roomId}`를 구독해 새 메시지를 실시간으로 수신한다.
- 딜러 역경매 매칭: 채팅방의 "매칭하기"는 해당 매물에 가격을 제안한 공인중개사 목록(`DealerMatchModal.vue`)을 보여주고, 수락 시 백엔드가 메시지만 응답하므로 FE가 `chatApi.getRooms()`를 다시 호출해 참가자 정보를 갱신한다.

### 디자인 시스템
- Tailwind CSS 4 기반, `bg-canvas`/`text-ink`/`border-hairline` 등 시맨틱 토큰과 다크모드 페어(`dark:*`)를 일관되게 사용.
- 공용 모달은 Teleport 기반 셸(150ms 배경 딜레이 + 220ms 팝 애니메이션)을 공유한다(`ConfirmModal.vue`, `DealerMatchModal.vue`, `OfferModal.vue` 등).

### 가격/단위 표기
- 가격은 백엔드에서 "만원" 단위로 내려오며, `src/utils/format.ts`의 `formatManWon`이 "1억 5,000만" 형태로 변환한다.

## 배포
- Vercel(`vercel.json`)에 배포되며, API 경로는 동일한 백엔드 게이트웨이(`http://168.107.54.139:8080`)로 리라이트된다. OAuth2 콜백(`/oauth2/callback`)만 SPA 라우트로 직접 매핑되고, 그 외 모든 경로는 `index.html`로 폴백된다.
