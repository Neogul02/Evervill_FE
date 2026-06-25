# 공인중개사 매칭 + 회원가입 역할(Role) 확장 계획

> 상태: **회원가입/관리자 승인 흐름은 실제 백엔드 스펙으로 연동 완료. 채팅 매칭(1.3~1.4)은 여전히 미구현.**
> 아래 1.2/1.5는 실제 Swagger 스펙 기준으로 다시 작성됨 — 원래 계획(사업자등록증+자격증 파일 2종, `/api/admin/dealers`)과 다르다.

## 진행 상황

| 구분 | 상태 |
|---|---|
| 1.1 Role 확장 | 미확인 — `GET /auth/me` 응답에 `role: 'DEALER'`가 실제로 오는지 미확인 (User.dealerProfile 타입은 구버전 가정 그대로 남아있음) |
| 1.2 공인중개사 가입 (`POST /auth/signup/realtor`) | ✅ 연동 완료 — 파일 업로드 없음, `businessName`/`businessNumber`/`officeAddress` 텍스트 필드만 |
| 1.3 공인중개사 목록 (`GET /dealers`) | **미구현 — 추후 제공 예정** |
| 1.4 채팅방 딜러 참가 | **미구현 — 추후 제공 예정** |
| 1.5 관리자 승인/거부/목록 (`/auth/admin/realtor-applications`) | ✅ 연동 완료 |
| 2.1 타입 확장 | ✅ 완료 — [src/types/auth.ts](../../src/types/auth.ts) `RealtorRegisterRequest`, [src/types/dealer.ts](../../src/types/dealer.ts) `RealtorApplication` |
| 2.2 API 모듈 | ✅ 완료 — [src/api/auth.ts](../../src/api/auth.ts) `registerRealtor`, [src/api/admin.ts](../../src/api/admin.ts) `getRealtorApplications/approveDealer/rejectDealer` |
| 2.3 회원가입 폼 | ✅ 완료 — [src/views/RegisterView.vue](../../src/views/RegisterView.vue) (파일 업로드 UI 제거, 상호명/사업자등록번호/사업장주소 입력으로 교체) |
| 2.4 매칭하기 버튼 + 모달 | 미구현 — [src/components/chat/DealerMatchModal.vue](../../src/components/chat/DealerMatchModal.vue), [src/api/dealer.ts](../../src/api/dealer.ts)는 여전히 1.3 가정(`/api/dealers`) 그대로, 백엔드 확정 전까지 보류 |
| 2.5 관리자 중개사 승인 탭 | ✅ 완료 — [src/views/AdminView.vue](../../src/views/AdminView.vue), 신청자 닉네임/이메일은 `authApi.getPublicProfile(userId)`로 별도 조회 (목록 응답에 userId만 있음) |
| 2.6 라우팅/가드 | 변경 불필요 |

**1.3(매칭 목록)/1.4(채팅방 참가)는 아직 실제 스펙을 받지 못해 기존 가정대로 남아있다** — 백엔드 확정 시 `src/api/dealer.ts`, `src/types/dealer.ts`의 `Dealer` 타입, `DealerMatchModal.vue`를 재확인해야 한다.

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

### 1.3 공인중개사 목록 조회 (`GET /dealers`)

매칭 모달에서 사용. `dealerStatus = 'APPROVED'`(또는 `role = 'DEALER'`)인 유저만 반환.

```json
{ "success": true, "data": [
  { "id": 12, "nickname": "강남부동산 김중개사", "profileImageUrl": "...", "realEstateLocation": "서울시 강남구..." }
]}
```
인증된 사용자라면 누구나 호출 가능 (매칭 시도 시 호출).

### 1.4 채팅방에 딜러 참가시키기 (`POST /api/chat/rooms/{roomId}/participants`)

기존 `ChatRoom.participants`([src/types/chat.ts](../../src/types/chat.ts):1-7)에 이미 `role: string` 필드가 있어 3자 채팅 구조를 그대로 활용할 수 있다.

**요청:** `{ "dealerId": 12 }` (헤더는 기존 패턴과 동일하게 `X-User-Id`)

**동작:**
1. 요청자가 해당 방의 활성 참가자인지 확인 (본인 거래방에서만 매칭 가능).
2. `dealerId`가 `dealerStatus = 'APPROVED'`인 유저인지 확인, 아니면 400/404.
3. 해당 유저를 `participants`에 `role: 'DEALER'`로 추가하고, 시스템 메시지("OOO 공인중개사가 채팅에 참가했습니다") 발송.
4. 이미 딜러가 참가한 방에 다시 매칭 시도하면 409 또는 교체 정책 — **백엔드 확인 필요**: 기존 딜러를 교체할 수 있게 할지, 1회만 매칭 가능하게 할지 결정 필요. FE는 모달에서 "이미 매칭된 딜러가 있습니다" 안내만 보여주면 되므로 어느 쪽이든 대응 가능.

응답: 갱신된 `ChatRoom` 객체 (participants 포함).

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

### 2.4 매칭하기 버튼 + 모달 (채팅방)
[src/views/ChatView.vue](../../src/views/ChatView.vue):
- 채팅방 헤더(300-329줄, `isConnected` 배지 옆)에 "매칭하기" 버튼 추가. 이미 딜러가 참가한 방이면 버튼을 "매칭됨" 배지로 대체.
- 클릭 시 신규 컴포넌트 `src/components/chat/DealerMatchModal.vue`를 띄움 — [src/components/ui/ConfirmModal.vue](../../src/components/ui/ConfirmModal.vue)의 `<Teleport to="body">` + 커스텀 backdrop/애니메이션 패턴을 그대로 따름 (외부 모달 라이브러리 미사용 컨벤션 유지).
- 모달 내부: `dealerApi.getApprovedDealers()` 호출 → 닉네임/프로필 이미지/부동산 위치를 보여주는 단순 리스트, 항목 클릭 시 확인 후 `chatApi.addDealerParticipant(roomId, dealerId)` 호출.
- 성공 시 `selectedRoom.value`의 `participants`를 갱신하고 모달 닫기. 실패(이미 매칭됨 등) 시 에러 메시지 표시.
- 메시지 목록에 딜러 참가 시 백엔드가 보낸 시스템 메시지가 일반 메시지처럼 표시되는지 확인 (별도 시스템 메시지 스타일은 이번 스코프에서 제외, 추후 개선 항목).

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
2. 이미 딜러가 있는 채팅방에 재매칭 시 교체 허용 여부 (1.4)
3. 첨부서류 파일의 접근 권한 범위 (관리자만 / 본인+관리자만)
