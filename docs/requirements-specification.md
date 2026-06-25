# Evervill 요구사항 정의서

> 작성 기준: 현재 프론트엔드(`src/`) 구현 상태 전체 — 라우트(`src/router/index.ts`), API 클라이언트(`src/api/*.ts`), 타입(`src/types/*.ts`), 화면(`src/views/**`) 기반으로 역산.
> 기존 `ERD.ts`(베이스라인 DB 스키마)에는 없는 기능(딜러 역경매, 공인중개사 가입승인, 3자 채팅)도 현재 FE 기준으로 포함했다.

## 1. 개요

### 1.1 목적
부동산 매물(전세/월세/매매)을 일반 사용자 간에 직거래로 등록·탐색·채팅으로 거래하고, 국토부 실거래가 데이터를 함께 비교할 수 있는 마켓플레이스. 추가로 공인중개사가 매물에 중개 수수료(복비)를 미리 제안해 거래에 개입할 수 있는 "역경매" 구조와, AI 기반 매물 가격/등기부등본 분석을 제공한다.

### 1.2 범위
프론트엔드(Vue 3 + TypeScript) 기준의 기능 요구사항을 정의한다. 백엔드 API 계약은 `src/api/*.ts`에서 호출하는 형태를 그대로 인용하며, 미확정/요청 예정 사항은 별도로 표기한다.

### 1.3 사용자 유형 (Role)

| Role | 설명 | 부여 방식 |
|---|---|---|
| 비로그인 사용자 | 매물/실거래가 열람만 가능 | - |
| `USER` (일반회원) | 회원가입 직후 기본 권한. 매물 등록/북마크/채팅/신고 가능 | 이메일 회원가입 |
| `DEALER` (공인중개사) | 매물에 복비 가격 제안, 본인 제안 매물 관리 | `USER`로 가입 신청(`/auth/signup/realtor`) 후 관리자 승인 시 전환 |
| `ADMIN` (관리자) | 공지/신고/배치/공인중개사 승인 등 운영 기능 전체 | 시스템 내부 부여(가입 플로우 없음) |

## 2. 기능 요구사항 (Functional Requirements)

### FR-AUTH — 인증/회원관리

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-AUTH-01 | 이메일/비밀번호로 일반 회원가입(닉네임/프로필 이미지 선택) | `POST /auth/signup` |
| FR-AUTH-02 | 공인중개사 가입 신청(상호명/사업자번호/사무소 주소 입력, 즉시 USER로 가입되며 승인 대기) | `POST /auth/signup/realtor` |
| FR-AUTH-03 | 로그인 시 Access/Refresh 토큰 발급 | `POST /auth/login` |
| FR-AUTH-04 | Access Token 만료 시 자동 재발급(silent refresh) — 사용자가 로그아웃되지 않고 백그라운드에서 토큰 갱신 | `POST /auth/reissue` |
| FR-AUTH-05 | 카카오 소셜 로그인 콜백 처리 | `/oauth2/callback` |
| FR-AUTH-06 | 로그아웃(토큰 폐기) | `POST /auth/logout` |
| FR-AUTH-07 | 내 정보 조회/수정(닉네임, 프로필 이미지), 비밀번호 변경 | `GET/PATCH /auth/me`, `POST /auth/me/image`, `PATCH /auth/me/password` |
| FR-AUTH-08 | 타 사용자 공개 프로필(닉네임/프로필이미지) 조회 — 신고 목록·딜러 매칭 등에서 사용 | `GET /auth/users/{id}` |
| FR-AUTH-09 | 회원가입 실패 시 입력 폼을 유지하고 페이지 내에서 에러 메시지 표시(전역 에러 페이지로 이동하지 않음) | FE 처리 (`client.ts` 인터셉터 예외) |

### FR-DEALER-SIGNUP — 공인중개사 가입 승인

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-DS-01 | 관리자는 대기 중인 공인중개사 가입 신청 목록을 조회한다 | `GET /auth/admin/realtor-applications` |
| FR-DS-02 | 관리자는 신청 상세(사업자등록증 이미지 등)를 조회한다 | `GET /auth/admin/realtor-applications/{id}` |
| FR-DS-03 | 관리자는 신청을 승인한다 — 승인 시 해당 사용자의 role이 `DEALER`로 전환된다 | `PATCH /auth/admin/realtor-applications/{id}/approve` |
| FR-DS-04 | 관리자는 신청을 거절한다 | `PATCH /auth/admin/realtor-applications/{id}/reject` |
| FR-DS-05 | role이 `DEALER`로 전환된 사용자는 재로그인(또는 토큰 재발급) 후 nav에 "내 제안" 탭이 노출된다 | FE 라우터 가드(`requiresDealer`) |

### FR-LISTING — 매물

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-LST-01 | 매물 등록(거래유형/가격/면적/층/주소/위경도/이미지) | `POST /api/listings`, `POST /api/listings/{id}/images` |
| FR-LST-02 | 매물 수정/삭제(본인 소유 매물만) | `PUT/DELETE /api/listings/{id}` |
| FR-LST-03 | 매물 목록 조회(거래유형/가격/면적/주소/키워드 필터, 페이지네이션) | `GET /api/listings` |
| FR-LST-04 | 매물 상세 조회(조회수 증가, 인근 실거래가 비교 데이터 포함) | `GET /api/listings/{id}` |
| FR-LST-05 | 매물 이미지 추가/삭제 | `POST/DELETE /api/listings/{id}/images*` |
| FR-LST-06 | 매물 북마크 등록/해제, 내 북마크 목록 조회 | `POST/DELETE /api/listings/{id}/bookmark`, `GET /api/listings/bookmarks` |
| FR-LST-07 | 최근 본 매물 목록 조회 | `GET /api/listings/recent` |
| FR-LST-08 | 내가 등록한 매물 목록 조회 | `GET /api/listings/my` |
| FR-LST-09 | 매물 신고(사유 입력) | `POST /api/listings/{id}/report` |

### FR-OFFER — 딜러 역경매(가격 제안)

| ID | 요구사항 | 관련 엔드포인트 | 권한 |
|---|---|---|---|
| FR-OFR-01 | 공인중개사는 매물에 중개 수수료(복비)를 제안한다. 이미 제안이 있으면 재제안 시 기존 제안 가격을 덮어쓴다 | `POST /api/listings/{listingId}/offers` | `DEALER` |
| FR-OFR-02 | 매물에 들어온 제안 목록을 조회한다(상태 `PENDING`만 화면에 노출) | `GET /api/listings/{listingId}/offers` | 인증 사용자 전체 |
| FR-OFR-03 | 매물 상세에서 공인중개사는 본인이 제안한 가격을 확인하고 "제안 수정하기"로 재제안할 수 있다 | FE: `ListingDetailPanel.vue` + `OfferModal.vue` | `DEALER` |
| FR-OFR-04 | 채팅방에서 "매칭하기"를 누르면 해당 매물에 제안한 공인중개사 목록(가격 포함)이 표시된다 | FE: `DealerMatchModal.vue` | 채팅방 참여자 |
| FR-OFR-05 | 채팅방 참여자는 특정 공인중개사의 제안을 수락할 수 있다 — 수락 시 해당 공인중개사가 채팅방에 참가한다 | `POST /api/chat/rooms/{roomId}/offers/{offerId}/accept` | 채팅방 참여자 |
| FR-OFR-06 | 채팅방 참여자는 특정 제안을 취소(거절)할 수 있다 | `POST /api/chat/rooms/{roomId}/offers/{offerId}/cancel` | 채팅방 참여자 |
| FR-OFR-07 | 공인중개사는 본인이 제안을 넣은 매물 목록을 별도 페이지(`/dealer/offers`)에서 확인한다(제안 가격 포함, 조회수/북마크 수는 노출 안 함) | `GET /api/listings/my-offers` | `DEALER` |
| FR-OFR-08 | 제안 제출/수락/취소 실패 시 전역 에러 페이지로 이동하지 않고 해당 화면(모달)에서 에러 메시지를 인라인으로 보여준다 | FE 처리 (`client.ts` 인터셉터 예외) | - |

### FR-MARKET — 실거래가

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-MKT-01 | 국토부 실거래가 목록 조회(지역/거래유형/가격/면적/거래연월 필터) | `GET /api/market` |
| FR-MKT-02 | 실거래가 상세 조회 | `GET /api/market/{id}` |
| FR-MKT-03 | 실거래가 북마크 등록/해제, 내 북마크 목록 조회 | `POST/DELETE /api/market/{id}/bookmark`, `GET /api/market/bookmarks` |

### FR-CHAT — 채팅

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-CHT-01 | 매물 상세에서 채팅 시작 시 기존 방이 있으면 재사용, 없으면 생성 | `POST /api/chat/rooms` |
| FR-CHT-02 | 내 채팅방 목록 조회(마지막 메시지, 안읽음 수 포함) | `GET /api/chat/rooms` |
| FR-CHT-03 | 채팅방 메시지 목록 조회 및 전송 | `GET/POST /api/chat/rooms/{roomId}/messages` |
| FR-CHT-04 | 실시간 메시지 수신(WebSocket/STOMP, `/topic/chat/{roomId}` 구독) | `useChat.ts` |
| FR-CHT-05 | 채팅방 읽음 처리 | `PUT /api/chat/rooms/{roomId}/read` |
| FR-CHT-06 | 채팅방 나가기 | `DELETE /api/chat/rooms/{roomId}` |
| FR-CHT-07 | (FR-OFR-04~06 참고) 채팅방 내에서 딜러 매칭 모달 노출 | - |

### FR-AI — AI 분석

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-AI-01 | 특정 매물의 AI 가격 적정성 분석 요청/조회 | `POST /api/ai/analyses/price/{listingId}` |
| FR-AI-02 | 등기부등본 파일 업로드 후 AI 위험도 분석(`SAFE`/`CAUTION`/`DANGER`) | `POST /api/ai/analyses/registry` |
| FR-AI-03 | 내가 요청한 AI 분석 이력 목록 조회(대시보드) | `GET /api/ai/analyses` |
| FR-AI-04 | AI 분석 페이지(`/ai/registry`)는 nav에서 직접 접근 가능 | FE 라우트 |

### FR-NOTICE — 공지/이벤트

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-NTC-01 | 공지/이벤트 목록 공개 조회 | `GET /api/notices` |
| FR-NTC-02 | 관리자는 공지/이벤트를 등록/수정/삭제하고 노출 기간(`startAt`~`endAt`)·활성 여부를 관리한다 | `/api/admin/notices*` |

### FR-ADMIN — 운영 관리

| ID | 요구사항 | 관련 엔드포인트 |
|---|---|---|
| FR-ADM-01 | 신고 목록 조회(상태별 필터), 신고자/대상자 프로필을 닉네임·사진과 함께 노출 | `GET /api/admin/reports` + `GET /auth/users/{id}` 보강 |
| FR-ADM-02 | 신고 처리(처리완료/반려) | `PUT /api/admin/reports/{id}/status` |
| FR-ADM-03 | 매물 강제 삭제(약관 위반 등) | `DELETE /api/admin/listings/{id}` |
| FR-ADM-04 | 실거래가 배치 수동 트리거(연월 지정) | `POST /api/admin/batch/market` |
| FR-ADM-05 | (FR-DS-01~04 참고) 공인중개사 가입 신청 승인/거절 관리 | - |

### FR-COMMON — 공통

| ID | 요구사항 |
|---|---|
| FR-CMN-01 | 라우트 가드: `requiresAuth`(로그인 필요), `requiresAdmin`, `requiresDealer`, `guestOnly` 메타에 따라 미충족 시 로그인 페이지 또는 홈으로 리다이렉트 |
| FR-CMN-02 | 4xx/5xx 공통 에러 페이지(`/error/4xx`, `/error/5xx`) — 단, 회원가입·딜러 제안/수락/취소 요청은 예외적으로 페이지 이동 없이 인라인 에러 처리 |
| FR-CMN-03 | 404 Not Found 페이지 |
| FR-CMN-04 | 다크모드 지원 |
| FR-CMN-05 | 페이지 전환 시 상단 진행률 바(`useNavProgress`) 표시 |

## 3. 비기능 요구사항 (Non-Functional Requirements)

| 구분 | 내용 |
|---|---|
| 인증/인가 | JWT 기반(Access + Refresh). 일부 엔드포인트는 게이트웨이가 JWT에서 role을 자동 추출하지 못해 `X-User-Id`/`X-User-Role` 헤더를 클라이언트가 직접 첨부해야 함(특히 `DEALER` 권한 엔드포인트) |
| 보안 | 라우트 단위 역할 기반 접근 제어(RBAC), 비밀번호 변경 시 현재 비밀번호 확인 |
| 가용성/복원력 | Access Token 만료 시 동시 다발 요청에 대해 단일 재발급(single-flight)으로 처리해 중복 재발급 방지 |
| 성능 | AI 분석 요청은 처리 시간이 길 수 있어 별도 무제한 타임아웃 적용 |
| 사용성 | 회원가입/딜러 제안 등 사용자 입력이 많은 폼은 실패 시에도 입력값을 보존 |
| 국제화 | 한국어 UI, 가격은 "만원" 단위 표기(예: "1억 5,000만") |
| 데이터 정렬/필터 | 배열 파라미터는 Spring `@RequestParam List<T>` 호환 형식(`key=a&key=b`)으로 직렬화 |

## 4. 가정 및 제약사항

- 이 문서는 프론트엔드 구현을 기준으로 역산되었으며, 일부 항목(공인중개사 가입/딜러 역경매 관련 정확한 응답 스키마)은 백엔드와의 Swagger 교차 확인을 거쳐 확정됨.
- `User.dealerProfile`(중개업소 위치, 등록번호, 사업자등록증/중개사자격증 파일 URL)은 FE 타입에는 정의되어 있으나 실제 백엔드 응답에서 아직 검증되지 않은 필드가 일부 포함됨(주석상 "요청 예정 — 현재 백엔드 미구현"으로 표기된 항목 존재).
- 기존 `ERD.ts`(베이스라인 스키마)는 `DEALER` role, 딜러 제안(`listing_offers`), 공인중개사 가입신청(`realtor_applications`), 3자 참여 채팅방 구조를 반영하지 못한 이전 버전이며, 본 문서와 `docs/er-diagram.md`가 최신 상태를 반영한다.
