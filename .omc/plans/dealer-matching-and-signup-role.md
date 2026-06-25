# 공인중개사 매칭 + 회원가입 역할(Role) 확장 계획

> 상태: **회원가입/관리자 승인 흐름은 실제 백엔드 스펙으로 연동 완료.**
> **채팅 매칭은 "요청→딜러 승인" 모델로 재설계(2026-06-25) — 아직 백엔드 미구현, Phase 2 섹션 참고.**
> 아래 1.2/1.5는 실제 Swagger 스펙 기준으로 다시 작성됨 — 원래 계획(사업자등록증+자격증 파일 2종, `/api/admin/dealers`)과 다르다.

## 진행 상황

| 구분 | 상태 |
|---|---|
| 1.1 Role 확장 | 미확인 — `GET /auth/me` 응답에 `role: 'DEALER'`가 실제로 오는지 미확인 (User.dealerProfile 타입은 구버전 가정 그대로 남아있음) |
| 1.2 공인중개사 가입 (`POST /auth/signup/realtor`) | ✅ 연동 완료 — 파일 업로드 없음, `businessName`/`businessNumber`/`officeAddress` 텍스트 필드만 |
| 1.5 관리자 승인/거부/목록 (`/auth/admin/realtor-applications`) | ✅ 연동 완료 |
| 2.1 타입 확장 | ✅ 완료 — [src/types/auth.ts](../../src/types/auth.ts) `RealtorRegisterRequest`, [src/types/dealer.ts](../../src/types/dealer.ts) `RealtorApplication` |
| 2.2 API 모듈 | ✅ 완료 — [src/api/auth.ts](../../src/api/auth.ts) `registerRealtor`, [src/api/admin.ts](../../src/api/admin.ts) `getRealtorApplications/approveDealer/rejectDealer` |
| 2.3 회원가입 폼 | ✅ 완료 — [src/views/RegisterView.vue](../../src/views/RegisterView.vue) (파일 업로드 UI 제거, 상호명/사업자등록번호/사업장주소 입력으로 교체) |
| 2.5 관리자 중개사 승인 탭 | ✅ 완료 — [src/views/AdminView.vue](../../src/views/AdminView.vue), 신청자 닉네임/이메일은 `authApi.getPublicProfile(userId)`로 별도 조회 (목록 응답에 userId만 있음) |
| **Phase 2** 채팅 매칭(요청→승인) + 딜러 전용 페이지 | **계획 단계 — 백엔드 API 전부 미구현, 하단 "Phase 2" 섹션 참고. 승인 전 코드 작성 금지.** |

옛 1.3(`GET /dealers` 즉시매칭 전제)/1.4(`POST .../participants` 즉시 참가)는 "선택 즉시 합류" 모델이었으나, 이번에 "선택 → 요청 생성 → 딜러 승인 시에만 합류"로 요구사항이 바뀌어 **Phase 2 섹션의 새 엔드포인트로 대체**한다. 기존 [src/api/dealer.ts](../../src/api/dealer.ts), [src/api/chat.ts](../../src/api/chat.ts)의 `addDealerParticipant`, [src/components/chat/DealerMatchModal.vue](../../src/components/chat/DealerMatchModal.vue)는 Phase 2 구현 시 함께 교체된다.

## 배경

채팅방에서 거래 상대(매수/매도자)끼리 대화하다가, 등록된 공인중개사를 매칭해 채팅방에 합류시키는 기능을 추가한다. 이를 위해서는:
1. 회원가입 시 "일반 유저" / "공인중개사"를 선택할 수 있어야 하고,
2. 공인중개사는 사업자 서류를 첨부해 관리자 심사를 받아야 하며,
3. 관리자는 심사 대기 중인 공인중개사를 승인/거부할 수 있어야 한다.

현재 `User.role`은 `'USER' | 'ADMIN'` 두 가지뿐이고([src/types/auth.ts](../../src/types/auth.ts):6), 채팅(`ChatView.vue`)에는 매칭/거래 관련 버튼이 전혀 없다. 이 기능 전체는 **백엔드 스키마/API 확장이 선행되어야** 동작하므로, 본 문서는 백엔드 요청 사항과 그 이후의 FE 구현 단계를 함께 정리한다.

## 사용자 확인 사항 (인터뷰 결과)

- **매칭하기 버튼 위치**: 채팅방 내부 (`ChatView.vue` 채팅방 헤더)
- **매칭 결과**: 현재 채팅방에 선택한 공인중개사를 참가시켜 3자 채팅으로 전환 (별도 채팅방 생성 아님)
- **딜러 목록 필터**: MVP는 승인된 전체 딜러를 단순 나열 (지역/전문분야 필터 없음)
- **관리자 심사 UI**: MVP는 목록 + 승인/거부 버튼만 (서류는 다운로드 링크로 제공, 인라인 미리보기 없음)

---

## 1. 백엔드 요청 사항

> FE 리포지토리에는 백엔드가 없으므로, 아래 항목은 백엔드 팀에 전달할 API/스키마 요청이다. FE 구현은 이 항목들이 준비된 뒤에 진행한다.

### 1.1 Role 확장 + Dealer 심사 상태

`User.role`에 `DEALER` 추가: `'USER' | 'ADMIN' | 'DEALER'`.

**결정이 필요한 부분 (정책 확인 요청)**: 딜러로 가입 신청한 유저가 관리자 승인 전에도 `role: 'DEALER'`를 가져야 하는가, 아니면 승인 후에만 `DEALER`가 되어야 하는가?
- **권장안**: 가입 시점엔 `role: 'USER'`를 유지하고 별도 필드 `dealerStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'`를 둔다. 관리자가 승인하는 순간 `role`을 `DEALER`로 바꾸고 `dealerStatus = 'APPROVED'`로 전환한다. 이렇게 하면 미승인 딜러가 `DEALER` 권한(매칭 모달 목록 노출 등)을 갖는 사고를 막을 수 있다.
- 대안: `role: 'DEALER'`를 가입 즉시 부여하고 `dealerStatus`만으로 권한을 게이팅. FE 입장에서는 어느 쪽이든 응답 필드만 맞으면 동작하므로 백엔드 팀이 결정.

**User 응답에 추가될 필드 (제안):**
```json
{
  "role": "USER" | "ADMIN" | "DEALER",
  "dealerStatus": "NONE" | "PENDING" | "APPROVED" | "REJECTED",
  "dealerProfile": {
    "realEstateLocation": "서울시 강남구 ...",
    "brokerRegistrationNumber": "12345-2024-00001",
    "businessRegistrationFileUrl": "https://.../biz.pdf",
    "brokerLicenseFileUrl": "https://.../license.pdf"
  }
}
```
`dealerProfile`은 `role/dealerStatus`가 `NONE`이 아닌 유저에만 존재.

### 1.2 회원가입 API 확장 (`POST /auth/signup`)

기존 `register()`([src/api/auth.ts](../../src/api/auth.ts):19-28)는 이미 FormData(email/password/nickname/profileImage)로 전송하도록 FE가 구현돼 있으나 백엔드가 아직 멀티파트를 받지 않는 상태([src/types/auth.ts](../../src/types/auth.ts):26,28 주석 참고). 이번에 같은 엔드포인트에 아래 필드를 추가로 받아야 한다.

**추가 요청 필드 (`accountType`이 `DEALER`일 때만 필수):**
| 필드명 | 타입 | 설명 |
|---|---|---|
| `accountType` | `'USER' \| 'DEALER'` | 회원가입 시 토글로 선택 |
| `realEstateLocation` | string | 본인 부동산(영업소) 위치 |
| `brokerRegistrationNumber` | string | 부동산 중개업 등록번호 |
| `businessRegistrationFile` | file | 사업자 등록증 |
| `brokerLicenseFile` | file | 부동산 중개업 자격증 |

**동작:**
1. `accountType === 'DEALER'`이면 위 4개 필드 필수 검증, 누락 시 400.
2. 가입 직후 `role: 'USER'`, `dealerStatus: 'PENDING'`으로 저장 (1.1 권장안 기준). 일반 유저는 `dealerStatus: 'NONE'`.
3. 응답 포맷은 기존과 동일하게 유지.

### 1.3, 1.4 (대체됨)

~~공인중개사 목록 조회 / 채팅방에 딜러 즉시 참가시키기~~ — "선택하면 즉시 합류" 모델은 폐기. **요청→딜러 승인** 모델로 대체되어 하단 "Phase 2" 섹션(2.1~2.5)에서 재정의함.

### 1.5 관리자 — 딜러 승인 (`GET /api/admin/dealers`, `PUT /api/admin/dealers/{id}/approve`, `PUT /api/admin/dealers/{id}/reject`)

기존 `adminApi` 패턴([src/api/admin.ts](../../src/api/admin.ts):42-69)과 동일하게 `X-User-Id` 헤더만 사용.

```
GET /api/admin/dealers?status=PENDING
→ [{ id, nickname, email, realEstateLocation, brokerRegistrationNumber,
     businessRegistrationFileUrl, brokerLicenseFileUrl, dealerStatus, createdAt }]

PUT /api/admin/dealers/{id}/approve  → dealerStatus 'APPROVED', role 'DEALER'로 전환
PUT /api/admin/dealers/{id}/reject   → dealerStatus 'REJECTED' (body: { reason?: string } 선택)
```

---

## 2. FE 구현 단계

> **전제**: 1.1~1.5의 백엔드 API가 준비된 뒤 시작. 이 섹션은 "계획"이며, 사용자의 명시적 실행 승인 전에는 코드를 작성하지 않는다.

### 2.1 타입 확장
- [src/types/auth.ts](../../src/types/auth.ts): `User.role`에 `'DEALER'` 추가, `dealerStatus`/`dealerProfile` 필드 추가, `RegisterRequest`에 `accountType`/딜러 전용 필드 추가.
- [src/types/chat.ts](../../src/types/chat.ts): 변경 불필요 — `ChatParticipant.role`이 이미 `string`이라 `'DEALER'` 값을 그대로 사용 가능.
- 신규 `src/types/dealer.ts`: `Dealer`, `DealerApplication` 등 응답 타입 정의.

### 2.2 API 모듈
- [src/api/auth.ts](../../src/api/auth.ts):19-28 `register()`에 `accountType`/딜러 필드를 FormData로 추가 전송.
- 신규 `src/api/dealer.ts`: `dealerApi.getApprovedDealers()`.
- [src/api/chat.ts](../../src/api/chat.ts): `chatApi.addDealerParticipant(roomId, dealerId)` 추가.
- [src/api/admin.ts](../../src/api/admin.ts): `adminApi.getPendingDealers()`, `approveDealer(id)`, `rejectDealer(id, reason?)` 추가.

### 2.3 회원가입 폼 — 역할 토글 + 딜러 전용 필드
[src/views/RegisterView.vue](../../src/views/RegisterView.vue):
- 이메일 입력란 위(또는 상단)에 "일반 회원 / 공인중개사" 토글 추가 — `AdminView.vue`의 버튼식 토글 패턴(193-201줄)을 재사용.
- `accountType === 'DEALER'`일 때만 아래 필드를 조건부 렌더링:
  - 부동산 위치 (text input)
  - 부동산 중개업 등록번호 (text input)
  - 사업자 등록증 첨부 (file input — 기존 프로필 이미지 업로드 패턴(89-100줄) 재사용)
  - 부동산 중개업 자격증 첨부 (file input — 동일 패턴)
- 제출 시 딜러 필드 누락 검증 추가, 가입 성공 후 안내 문구를 분기:
  - 일반 유저: 기존과 동일하게 `/login`으로 이동.
  - 딜러: "심사 후 승인되면 공인중개사로 활동할 수 있습니다" 안내 후 `/login` 이동.

### 2.4 매칭하기 버튼 + 모달 (채팅방) — (대체됨, Phase 2 참고)
~~이 섹션의 즉시-참가 흐름은 폐기~~ — "요청→딜러 승인" 모델로 Phase 2에서 재정의.

### 2.5 관리자 — 공인중개사 승인 탭
[src/views/AdminView.vue](../../src/views/AdminView.vue):
- `Tab` 타입(12줄)에 `'dealers'` 추가, 탭 버튼 목록(174줄)에 `['dealers','중개사 승인']` 추가.
- 신규 탭 템플릿: `adminApi.getPendingDealers()`로 목록 로드 → 신청자 닉네임/이메일/부동산 위치/등록번호 표시, 첨부서류 2건은 `<a :href="...FileUrl" target="_blank">보기</a>` 다운로드 링크로 제공.
- 승인/거부 버튼은 기존 "신고 관리" 탭의 처리/기각 버튼(283-286줄) 패턴 재사용.
- 승인 시 목록에서 제거하거나 상태 배지를 `APPROVED`로 갱신 (기존 `updateReportStatus` 패턴과 동일하게 로컬 상태 갱신, 재조회 없이).

### 2.6 라우팅/가드
- 신규 라우트 불필요 — 매칭 모달은 기존 `/chat`, 딜러 승인은 기존 `/admin` 내부 탭이므로 [src/router/index.ts](../../src/router/index.ts) 변경 없음.
- 딜러 전용 라우트(예: "내 매칭 요청함")는 이번 스코프에 포함하지 않음 — 필요 시 별도 계획으로 분리.

---

## Acceptance Criteria

- [ ] 회원가입 폼에서 "공인중개사" 토글 선택 시 부동산 위치/등록번호/서류 2종 입력란이 나타나고, 미입력 시 제출이 막힌다.
- [ ] 딜러로 가입한 계정은 관리자 승인 전까지 `role: 'USER'`로 유지되며 매칭 모달 목록에 노출되지 않는다.
- [ ] 채팅방 헤더의 "매칭하기" 버튼 클릭 시 승인된 딜러 목록이 모달에 표시된다.
- [ ] 모달에서 딜러를 선택하면 현재 채팅방의 `participants`에 해당 딜러가 추가되고, 채팅방을 나갔다 들어와도 3명이 함께 보인다 (새 채팅방이 생기지 않음).
- [ ] 이미 딜러가 매칭된 방에서 다시 매칭하기를 누르면 적절한 안내(에러 또는 교체 확인)가 표시된다.
- [ ] `/admin` 페이지에 "중개사 승인" 탭이 추가되어, 대기 중인 신청 목록과 첨부서류 다운로드 링크, 승인/거부 버튼이 보인다.
- [ ] 승인 처리 시 해당 유저의 `role`이 `DEALER`로 바뀌고, 이후 매칭 모달 목록에 노출된다.

## Risks and Mitigations

| 리스크 | 완화 방안 |
|---|---|
| 백엔드 API가 모두 준비되기 전까지 FE 작업이 전부 막힘 | 1.1~1.5 요청을 백엔드 팀에 먼저 전달하고, FE는 타입/모킹 데이터로 모달 UI만 선행 작업 가능 (API 연동은 마지막) |
| 미승인 딜러가 매칭 목록에 노출되는 보안/신뢰 문제 | `GET /dealers`가 서버 측에서 `dealerStatus = 'APPROVED'`만 필터링하도록 백엔드에 명시 (FE는 클라이언트 필터링에 의존하지 않음) |
| 딜러 서류(사업자등록증 등) 파일이 공개 URL로 노출 시 개인정보 우려 | 첨부서류 URL은 관리자 인증된 요청에서만 접근 가능하도록 백엔드에 권한 체크 요청 (1.5 항목에 포함해 재확인) |
| 채팅방 3자 참가 후 기존 2자 전제 UI(상대 닉네임 단수 표시 등)가 깨질 가능성 | `ChatView.vue`의 발신자 표시는 이미 `participantProfiles` 맵 기반(38-45줄)이라 인원 수에 영향받지 않음 — 구현 시 회귀 확인 필요 |

## Verification Steps

1. 백엔드 API 1.1~1.5 배포 후, Postman/curl로 각 엔드포인트 단독 호출해 응답 스키마가 본 문서와 일치하는지 확인.
2. 회원가입 폼에서 일반 유저/딜러 양쪽 가입을 각각 수행해 `dealerStatus`가 의도대로 저장되는지 확인.
3. 관리자 계정으로 로그인해 `/admin` → 중개사 승인 탭에서 승인/거부 처리 후 해당 유저로 재로그인해 `role`이 갱신됐는지 확인.
4. 두 일반 유저 간 채팅방에서 매칭하기로 딜러를 추가하고, 양쪽 클라이언트(구매자/판매자 브라우저)에서 모두 3명이 보이는지 확인.
5. 이미 딜러가 있는 방에서 재매칭 시도 시 에러/안내 동작 확인.

---

## 미해결 결정 사항 (백엔드 팀 확인 필요)

1. 딜러 승인 전 `role` 값을 `USER`로 유지할지, `DEALER`+게이팅 플래그로 둘지 (1.1)
2. 첨부서류 파일의 접근 권한 범위 (관리자만 / 본인+관리자만)

---

# Phase 2: 채팅 매칭(요청→딜러 승인) + 딜러 전용 "부동산관리" 페이지

> 상태: **pending approval — 1.6(목록 조회)만 연동 완료, 1.7~1.10(요청-승인 모델)은 백엔드 미구현. 사용자의 명시적 실행 승인 전에는 추가 코드를 작성하지 않는다.**
> Direct 모드 계획 (사용자가 핵심 요구사항 3가지를 이미 명시함). 2026-06-25 작성.

## 결론: "순수 프론트로 끝까지 구현 가능한가?" → **아니오**

매칭 목록 조회, 매칭 요청 생성, 딜러의 승인/거절, 승인 시 3인 채팅방 전환은 모두 서버 상태(누가 어떤 방에 어떤 딜러에게 요청을 보냈는지, 딜러가 승인했는지)를 다뤄야 하므로 **새 백엔드 API 없이는 동작할 수 없다.** FE는 아래 "1. 백엔드 요청 사항"이 준비된 뒤에야 "2. FE 구현 단계"를 진행할 수 있다. 이 계획은 두 파트를 함께 정리해, 백엔드 요청을 먼저 전달할 수 있게 한다.

## 요구사항 요약

1. 채팅방에서 "매칭하기" 클릭 → 승인된 공인중개사 목록을 모달에 표시 (기존 [DealerMatchModal.vue](../../src/components/chat/DealerMatchModal.vue) UI 골격 재사용, 데이터/액션만 교체).
2. 딜러 선택 시 **즉시 합류가 아니라 "매칭 요청"을 생성** — 해당 딜러가 별도로 승인해야 그제서야 3인 채팅방으로 전환된다.
3. `role === 'DEALER'`인 유저는 [AppHeader.vue](../../src/components/layout/AppHeader.vue)의 "관리자" 탭과 동일한 자리에 **"부동산관리"** 탭이 보이고, 전용 페이지(`/dealer`)에서 본인에게 들어온 매칭 요청을 확인하고 승인/거절할 수 있다.

## 1. 백엔드 요청 사항

### 1.6 공인중개사 목록 조회 (`GET /auth/dealers`) — ✅ 연동 완료

비로그인 허용. 실제 응답:
```json
{ "success": true, "data": [
  { "id": 0, "nickname": "string", "profileImageUrl": "string", "businessName": "string", "officeAddress": "string" }
]}
```
[src/types/dealer.ts](../../src/types/dealer.ts) `Dealer`, [src/api/dealer.ts](../../src/api/dealer.ts) `getApprovedDealers()`, [DealerMatchModal.vue](../../src/components/chat/DealerMatchModal.vue) 목록 렌더링까지 반영됨. 단, 모달의 "선택 시 매칭 액션"은 여전히 1.7~1.10(요청-승인 모델) 대기 중이라 미연동.

### 1.7 매칭 요청 생성 (`POST /api/chat/rooms/{roomId}/match-requests`)

**요청:** `{ "dealerId": 12 }` (`X-User-Id` 헤더 기존 패턴 동일)

**동작:**
1. 요청자가 해당 방의 활성 참가자인지 확인.
2. `dealerId`가 `role = 'DEALER'`인 유저인지 확인, 아니면 400/404.
3. 해당 방에 이미 `ACCEPTED` 상태의 매칭(딜러 참가 완료)이 있으면 409.
4. `PENDING` 상태의 `MatchRequest` row 생성. 같은 방에 동시에 여러 딜러에게 요청을 보낼 수 있는지는 **백엔드 확인 필요** — FE는 "한 번에 한 명에게만"을 가정하고 만들 것을 권장(아래 미해결 사항 참고).

**응답 (제안):**
```json
{ "id": 101, "roomId": 55, "dealerId": 12, "dealerNickname": "강남부동산 김중개사", "status": "PENDING", "createdAt": "..." }
```

### 1.8 채팅방의 현재 매칭 상태 조회

기존 `GET /api/chat/rooms`, `GET /api/chat/rooms/{roomId}`([src/api/chat.ts](../../src/api/chat.ts)) 응답에 아래 필드를 추가해달라고 요청한다 (별도 엔드포인트보다 채팅방 목록/상세에 끼워 넣는 게 FE 추가 호출을 줄인다):

```json
{
  "...": "기존 ChatRoom 필드",
  "activeMatchRequest": {
    "id": 101,
    "dealerId": 12,
    "dealerNickname": "강남부동산 김중개사",
    "status": "PENDING" | "ACCEPTED" | "REJECTED"
  } | null
}
```
`ChatView.vue`가 방을 열었을 때 버튼을 "매칭하기" / "승인 대기 중" / "매칭됨" 3단계로 정확히 그리려면 이 필드가 필요하다 (현재는 `participants`에 DEALER 역할이 있는지만으로 "매칭됨"만 판단 가능, "대기 중"을 구분할 수 없음).

### 1.9 딜러 — 본인에게 들어온 매칭 요청 목록 (`GET /api/dealers/me/match-requests`)

쿼리 `?status=PENDING` 지원 (관리자 신고/딜러 목록과 동일한 패턴). 인증된 `role=DEALER` 본인만 호출 가능.

```json
{ "success": true, "data": [
  {
    "id": 101, "roomId": 55, "listingId": 9, "listingTitle": "강남 84㎡ 아파트",
    "requesterId": 7, "requesterNickname": "철수",
    "status": "PENDING", "createdAt": "..."
  }
]}
```
`requesterNickname`이 없으면 FE가 기존 신고 관리 탭과 동일하게 `authApi.getPublicProfile(requesterId)`로 보강 가능하므로 필수는 아니지만, 있으면 추가 호출이 줄어든다.

### 1.10 딜러 — 매칭 요청 승인/거절

```
PATCH /api/dealers/me/match-requests/{id}/accept
PATCH /api/dealers/me/match-requests/{id}/reject
```
(`/auth/admin/realtor-applications/{id}/approve` 패턴과 동일하게 body 없음, path id만)

**승인 시 동작:**
1. `MatchRequest.status = 'ACCEPTED'`.
2. 해당 `roomId`의 `participants`에 딜러를 `role: 'DEALER'`로 추가.
3. 같은 방에 걸려있는 다른 `PENDING` 요청이 있다면 자동 `REJECTED` 처리 (한 방에 딜러는 한 명).
4. 기존 채팅 STOMP 토픽(`/topic/chat/{roomId}`, [useChat.ts](../../src/composables/useChat.ts):44)에 시스템 메시지 또는 참가자 갱신 이벤트를 발송 — 요청자가 채팅방을 보고 있다면 별도 새로고침 없이 3인으로 전환되게 한다. **이벤트 포맷은 백엔드 확인 필요** (일반 `ChatMessage`로 위장해서 보낼지, 별도 `type` 필드를 추가할지).

**거절 시 동작:** `MatchRequest.status = 'REJECTED'`, 같은 토픽에 "OOO 공인중개사가 매칭 요청을 거절했습니다" 시스템 메시지 발송 (요청자가 다른 딜러를 다시 선택할 수 있게).

## 2. FE 구현 단계 (백엔드 1.6~1.10 준비된 뒤 진행)

### 2.1 타입
- [src/types/dealer.ts](../../src/types/dealer.ts): `MatchRequest` 추가 (`id, roomId, listingId?, listingTitle?, requesterId, requesterNickname?, dealerId?, dealerNickname?, status: 'PENDING'|'ACCEPTED'|'REJECTED', createdAt`), `Dealer.realEstateLocation` → `officeAddress`로 필드명 정정(1.6).
- [src/types/chat.ts](../../src/types/chat.ts): `ChatRoom`에 `activeMatchRequest?: { id: number; dealerId: number; dealerNickname: string; status: 'PENDING'|'ACCEPTED'|'REJECTED' } | null` 추가.

### 2.2 API 모듈
- [src/api/dealer.ts](../../src/api/dealer.ts): `getApprovedDealers()`는 유지(1.6), `requestMatch(roomId, dealerId)`(1.7), `getMyMatchRequests(status?)`(1.9), `acceptMatchRequest(id)`/`rejectMatchRequest(id)`(1.10) 추가.
- [src/api/chat.ts](../../src/api/chat.ts): `addDealerParticipant` 제거(즉시 참가 더 이상 없음).

### 2.3 `DealerMatchModal.vue` 재작성
- 목록까지는 동일(`getApprovedDealers()`), 딜러 클릭 시 확인 문구를 "매칭 요청을 보내시겠습니까? 공인중개사가 승인하면 채팅방에 참여합니다"로 변경.
- 확인 시 `dealerApi.requestMatch(roomId, dealerId)` 호출 → 성공 시 모달을 닫지 않고 "요청을 보냈습니다. 공인중개사 승인을 기다리는 중입니다" 안내 상태로 전환.
- `matched` 이벤트를 `requested` 이벤트로 변경(emit 시 `ChatRoom` 대신 갱신된 `activeMatchRequest` 전달), 즉시 3인 전환이 아니므로 컴포넌트 책임을 "요청 보내기"로 축소.
- props에 `activeMatchRequest`를 받아 이미 `PENDING`/`ACCEPTED` 상태면 목록 대신 현재 상태만 보여줌.

### 2.4 [ChatView.vue](../../src/views/ChatView.vue)
- 버튼 라벨 3단계: `매칭하기`(activeMatchRequest 없음) / `승인 대기 중`(PENDING, 클릭해도 모달은 상태만 보여줌) / `매칭됨`(ACCEPTED, 기존 로직).
- `handleDealerMatched`(47-54줄)를 `handleMatchRequested`로 변경 — `room.activeMatchRequest` 갱신 로직으로 교체, 룸 목록/선택된 룸 모두 갱신.
- STOMP 메시지 핸들러([useChat.ts](../../src/composables/useChat.ts) `onMessage` 콜백)에서 딜러 승인/거절 이벤트(1.10에서 백엔드와 포맷 확정) 수신 시 `selectedRoom`/`rooms`의 `participants`/`activeMatchRequest`를 갱신하도록 리스너 추가.

### 2.5 신규 `/dealer` 라우트 + `DealerView.vue`
- [src/router/index.ts](../../src/router/index.ts): `/admin` 라우트(104-108줄) 패턴과 동일하게 `{ path: '/dealer', name: 'dealer', component: () => import('@/views/DealerView.vue'), meta: { requiresAuth: true, requiresDealer: true } }` 추가. `beforeEach` 가드(139-153줄)에 `requiresDealer` 분기 추가.
- 신규 `src/views/DealerView.vue`: [AdminView.vue](../../src/views/AdminView.vue)의 `onMounted` 가드(`role !== 'DEALER'` → `router.replace('/')`) + 목록/카드 패턴을 그대로 따름. 탭 없이 단일 목록(요청 들어온 매칭 신청들), 카드에 요청자 닉네임(`authApi.getPublicProfile(requesterId)`로 보강, 신고 관리 탭과 동일 패턴)·매물 제목·요청 시각·승인/거절 버튼. 승인 시 해당 채팅방으로 이동 가능한 링크 제공.

### 2.6 [AppHeader.vue](../../src/components/layout/AppHeader.vue)
- 데스크톱(129-134줄)·모바일(224-230줄) 양쪽에 "관리자" 링크와 같은 자리/패턴으로 `v-if="authStore.user?.role === 'DEALER'"` "부동산관리" `RouterLink to="/dealer"` 추가.
- 신규 컴포저블 `src/composables/usePendingMatchRequestCount.ts` — [useUnreadChatCount.ts](../../src/composables/useUnreadChatCount.ts) 패턴(30초 폴링 `GET /api/dealers/me/match-requests?status=PENDING`의 길이) 그대로 mirror. `role === 'DEALER'`일 때만 `startPolling()`. "부동산관리" 탭 옆에 대기 건수 배지 표시.

## Acceptance Criteria

- [ ] 일반 유저가 채팅방에서 "매칭하기" 클릭 → 승인된 공인중개사 목록이 모달에 보인다 (`GET /dealers`).
- [ ] 딜러를 선택하면 즉시 3인이 되는 게 아니라 채팅방 버튼이 "승인 대기 중"으로 바뀐다.
- [ ] 매칭 요청을 받은 딜러가 `/dealer` 페이지에서 본인 계정으로 해당 요청을 확인할 수 있다.
- [ ] 딜러가 승인하면 요청자의 채팅방(열려 있는 상태에서도)이 자동으로 3인 채팅방으로 전환된다 (새로고침 불필요).
- [ ] 딜러가 거절하면 요청자에게 거절 안내가 표시되고, 다시 다른 딜러를 선택할 수 있다.
- [ ] `role !== 'DEALER'`인 유저는 `/dealer` 접근 시 라우터 가드에 의해 홈으로 리다이렉트된다.
- [ ] `role === 'DEALER'`인 유저만 nav에 "부동산관리" 탭이 보이고, 대기 중인 요청이 있으면 배지에 숫자가 표시된다.

## Risks and Mitigations

| 리스크 | 완화 방안 |
|---|---|
| 백엔드 API(1.6~1.10) 전부 미구현 — 지금 FE 코드를 짜도 동작 확인 불가 | 본 계획을 먼저 백엔드 팀에 전달, 승인 후 1.6~1.10 구현 완료 시점에 FE 작업 시작 |
| 같은 방에서 여러 딜러에게 동시에 요청을 보낼 수 있는지 정책 불명 (1.7) | FE는 "응답 대기 중인 요청이 있으면 새 요청 버튼 비활성화"로 보수적으로 구현, 백엔드가 다중 허용으로 확정되면 버튼만 다시 활성화 |
| 딜러 승인/거절을 요청자에게 실시간으로 알리는 이벤트 포맷 미정 (1.10) | 기존 STOMP `/topic/chat/{roomId}` 토픽을 재사용한다는 전제만 세워두고, 실제 이벤트 payload 포맷은 백엔드 확정 후 `useChat.ts` 핸들러를 맞춰 구현 |
| 딜러가 채팅 미참여 상태에서 매칭 요청을 못 보고 지나칠 가능성 | `/dealer` 페이지 배지(2.6)로 보완하되, 실시간 알림(딜러용 STOMP 구독)은 이번 스코프 제외 — 폴링 30초로 MVP, 추후 개선 항목 |

## Verification Steps

1. 백엔드 1.6~1.10 배포 후 Postman/curl로 각 엔드포인트 응답 스키마가 본 문서와 일치하는지 확인.
2. 구매자 계정으로 채팅방에서 매칭하기 → 딜러 선택 → "승인 대기 중" 버튼 전환 확인.
3. 딜러 계정으로 `/dealer` 접속 → 해당 요청이 목록에 보이는지, 승인 클릭 시 사라지는지 확인.
4. 구매자 클라이언트에서 채팅방을 열어둔 채로 위 3번 승인을 진행해, 새로고침 없이 3인 채팅방으로 전환되는지 확인 (STOMP 실시간 갱신 검증).
5. 거절 케이스: 딜러가 거절 시 구매자 쪽에 거절 안내가 뜨고 버튼이 다시 "매칭하기"로 돌아오는지 확인.
6. `role=USER`/`role=ADMIN` 계정으로 `/dealer` 직접 접근 시 홈으로 리다이렉트되는지 확인.

## 미해결 결정 사항 (백엔드 팀 확인 필요)

1. 한 채팅방에서 동시에 여러 딜러에게 매칭 요청을 보낼 수 있는지, 1명만 가능한지 (1.7)
2. 딜러 승인/거절을 요청자에게 알리는 실시간 이벤트의 정확한 payload 포맷 — 일반 메시지로 위장 vs 별도 `type` 필드 (1.10)
3. 딜러 본인용 실시간 알림(신규 요청 도착 시 푸시)을 이번 스코프에 넣을지, MVP는 30초 폴링으로 가도 되는지
