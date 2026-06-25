# 공인중개사 매칭 + 회원가입 역할(Role) 확장 계획

> 상태: **회원가입/관리자 승인 흐름은 실제 백엔드 스펙으로 연동 완료.**
> **채팅 매칭은 "딜러 역경매(가격 제안)" 모델로 재설계(2026-06-25, 2차 수정) — 백엔드 API 5개 전부 확정, FE 미구현. Phase 2 섹션 참고.**
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
| **Phase 2 (2차 수정)** 딜러 역경매(가격 제안) 매칭 | **계획 단계 — 백엔드 API 5개 확정, FE 코드 미작성. 승인 전 코드 작성 금지.** |

옛 "요청→딜러 승인" 모델(1차 수정, 2026-06-25 오전)은 폐기됨 — 사용자가 같은 날 오후 "딜러 역경매" 모델로 재변경. 이번엔 딜러가 먼저 매물에 복비 가격을 제안하고, 채팅방에서는 그 제안들 중 하나를 수락/취소하는 방식. [src/api/dealer.ts](../../src/api/dealer.ts)의 `getApprovedDealers()`(`GET /auth/dealers`)는 이 모델에서 더 이상 매칭 모달에 쓰이지 않음 — Phase 2 섹션 참고.

## 배경

채팅방에서 거래 상대(매수/매도자)끼리 대화하다가, 등록된 공인중개사를 매칭해 채팅방에 합류시키는 기능을 추가한다. 이를 위해서는:
1. 회원가입 시 "일반 유저" / "공인중개사"를 선택할 수 있어야 하고,
2. 공인중개사는 사업자 서류를 첨부해 관리자 심사를 받아야 하며,
3. 관리자는 심사 대기 중인 공인중개사를 승인/거부할 수 있어야 한다.

현재 `User.role`은 `'USER' | 'ADMIN'` 두 가지뿐이고([src/types/auth.ts](../../src/types/auth.ts):6), 채팅(`ChatView.vue`)에는 매칭/거래 관련 버튼이 전혀 없다. 이 기능 전체는 **백엔드 스키마/API 확장이 선행되어야** 동작하므로, 본 문서는 백엔드 요청 사항과 그 이후의 FE 구현 단계를 함께 정리한다.

## 사용자 확인 사항 (인터뷰 결과)

- **매칭하기 버튼 위치**: 채팅방 내부 (`ChatView.vue` 채팅방 헤더)
- **매칭 결과**: 현재 채팅방에 선택한 공인중개사를 참가시켜 3자 채팅으로 전환 (별도 채팅방 생성 아님)
- **딜러 목록 필터**: MVP는 승인된 전체 딜러를 단순 나열 (지역/전문분야 필터 없음) — *Phase 2 2차 수정으로 폐기, 가격 제안한 딜러만 표시로 변경*
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

~~공인중개사 목록 조회 / 채팅방에 딜러 즉시 참가시키기~~ — "선택하면 즉시 합류" 모델은 폐기. **딜러 역경매(가격 제안)** 모델로 대체되어 하단 "Phase 2" 섹션에서 재정의함.

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
~~이 섹션의 즉시-참가 흐름은 폐기~~ — "딜러 역경매" 모델로 Phase 2에서 재정의.

### 2.5 관리자 — 공인중개사 승인 탭
[src/views/AdminView.vue](../../src/views/AdminView.vue):
- `Tab` 타입(12줄)에 `'dealers'` 추가, 탭 버튼 목록(174줄)에 `['dealers','중개사 승인']` 추가.
- 신규 탭 템플릿: `adminApi.getPendingDealers()`로 목록 로드 → 신청자 닉네임/이메일/부동산 위치/등록번호 표시, 첨부서류 2건은 `<a :href="...FileUrl" target="_blank">보기</a>` 다운로드 링크로 제공.
- 승인/거부 버튼은 기존 "신고 관리" 탭의 처리/기각 버튼(283-286줄) 패턴 재사용.
- 승인 시 목록에서 제거하거나 상태 배지를 `APPROVED`로 갱신 (기존 `updateReportStatus` 패턴과 동일하게 로컬 상태 갱신, 재조회 없이).

### 2.6 라우팅/가드
- 신규 라우트 불필요 — 매칭 모달은 기존 `/chat`, 딜러 승인은 기존 `/admin` 내부 탭이므로 [src/router/index.ts](../../src/router/index.ts) 변경 없음.
- 딜러 전용 라우트는 Phase 2(2차 수정)에서 "내가 제안한 매물" 목록 페이지로 추가됨.

---

## Acceptance Criteria

- [ ] 회원가입 폼에서 "공인중개사" 토글 선택 시 부동산 위치/등록번호/서류 2종 입력란이 나타나고, 미입력 시 제출이 막힌다.
- [ ] 딜러로 가입한 계정은 관리자 승인 전까지 `role: 'USER'`로 유지되며 매칭 모달 목록에 노출되지 않는다.
- [ ] `/admin` 페이지에 "중개사 승인" 탭이 추가되어, 대기 중인 신청 목록과 첨부서류 다운로드 링크, 승인/거부 버튼이 보인다.
- [ ] 승인 처리 시 해당 유저의 `role`이 `DEALER`로 바뀐다.

## Risks and Mitigations

| 리스크 | 완화 방안 |
|---|---|
| 백엔드 API가 모두 준비되기 전까지 FE 작업이 전부 막힘 | 1.1~1.5 요청을 백엔드 팀에 먼저 전달하고, FE는 타입/모킹 데이터로 모달 UI만 선행 작업 가능 (API 연동은 마지막) |
| 딜러 서류(사업자등록증 등) 파일이 공개 URL로 노출 시 개인정보 우려 | 첨부서류 URL은 관리자 인증된 요청에서만 접근 가능하도록 백엔드에 권한 체크 요청 (1.5 항목에 포함해 재확인) |

## Verification Steps

1. 백엔드 API 1.1, 1.2, 1.5 배포 후, Postman/curl로 각 엔드포인트 단독 호출해 응답 스키마가 본 문서와 일치하는지 확인.
2. 회원가입 폼에서 일반 유저/딜러 양쪽 가입을 각각 수행해 `dealerStatus`가 의도대로 저장되는지 확인.
3. 관리자 계정으로 로그인해 `/admin` → 중개사 승인 탭에서 승인/거부 처리 후 해당 유저로 재로그인해 `role`이 갱신됐는지 확인.

---

## 미해결 결정 사항 (백엔드 팀 확인 필요)

1. 딜러 승인 전 `role` 값을 `USER`로 유지할지, `DEALER`+게이팅 플래그로 둘지 (1.1)
2. 첨부서류 파일의 접근 권한 범위 (관리자만 / 본인+관리자만)

---

# Phase 2 (2차 수정): 딜러 역경매(가격 제안) 매칭 + 딜러 전용 "내 제안 매물" 페이지

> 상태: **✅ FE 구현 완료(2026-06-25). 백엔드 5개 API 실제 스키마까지 확인하며 연동.**
> 1차 수정("요청→딜러 승인" 모델)은 전부 폐기. Direct 모드 계획.

## 모델 개요

기존(1차 수정) 모델: 채팅방에서 매수/매도자가 승인된 딜러 목록 중 하나를 골라 "요청"을 보내고, 딜러가 승인해야 합류 — **폐기됨.**

새(2차 수정) 모델 — **딜러 역경매**:
1. 딜러가 매물 상세 페이지를 둘러보다가, 원하는 매물에 미리 복비(중개 수수료) 가격을 제안해둔다. 채팅방이 아직 없어도 가능 — 매물 단위 제안.
2. 매수/매도자가 채팅방에서 "매칭하기"를 누르면, **그 매물에 제안을 넣은 딜러들의 목록**(가격 포함)이 뜬다.
3. 그중 하나를 **수락**하면 해당 딜러가 채팅방에 입장(3자 채팅으로 전환). **취소**하면 그 제안은 거절 처리된다.
4. 딜러는 본인이 제안을 넣은 매물들을 한곳에서 보는 전용 페이지("내 제안 매물")가 필요 — 기존 매물 목록 API와 동일한 정보 + 제안 가격, 조회수/북마크 수는 불필요.

## 백엔드 API (전부 확정됨 — 사용자 제공)

| API | Method | Path | 권한 |
|---|---|---|---|
| 매물에 제안된 중개사 목록 조회 (채팅방 매칭하기용) | GET | `/api/listings/{listingId}/offers` | 전체 |
| [딜러] 매물에 복비 가격 제안 (재제안 시 덮어씀) | POST | `/api/listings/{listingId}/offers` | DEALER |
| 중개사 제안 취소 | POST | `/api/chat/rooms/{roomId}/offers/{offerId}/cancel` | 채팅방 참여자 |
| 중개사 제안 수락 + 채팅방 입장 | POST | `/api/chat/rooms/{roomId}/offers/{offerId}/accept` | 채팅방 참여자 |
| [딜러] 내가 제안한 매물 목록 조회 | GET | `/api/listings/my-offers` | DEALER |

**실제 응답 스키마 (사용자 확인, 연동 완료):**
```json
// GET /api/listings/{listingId}/offers 응답 — dealerId만 있고 닉네임/프로필 사진 없음
{ "id": 1, "dealerId": 12, "price": 5000000, "status": "PENDING", "createdAt": "..." }
```
```json
// POST /api/listings/{listingId}/offers 요청/응답 — 요청 바디 { "price": 0 }, 응답 data는 메시지 문자열뿐
// 헤더 X-User-Id + X-User-Role 둘 다 필요 (게이트웨이가 역할을 자동 채우지 않음)
{ "success": true, "message": "string", "data": "string" }
```
```json
// POST /api/chat/rooms/{roomId}/offers/{offerId}/accept|cancel — X-User-Id만 필요, 응답 data도 메시지 문자열뿐
{ "success": true, "message": "string", "data": "string" }
```
```json
// GET /api/listings/my-offers — Listing 전체가 아니라 일부 필드 + myOfferPrice (조회수/북마크/위경도 없음)
// 헤더 X-User-Id + X-User-Role 필요
{ "id": 0, "sellerId": 0, "title": "string", "dealType": "SALE", "price": 0, "monthlyRent": 0,
  "area": 0, "floor": 0, "address": "string", "addressDetail": "string", "status": "ACTIVE",
  "images": [{ "id": 0, "imageUrl": "string", "sortOrder": 0 }], "createdAt": "...", "myOfferPrice": 0 }
```

**FE가 대응한 방식:**
- `dealerId`만 오므로 매칭 모달은 신고 관리 탭과 동일하게 `authApi.getPublicProfile(dealerId)`로 닉네임/프로필 사진을 별도 조회해서 보강한다([DealerMatchModal.vue](../../src/components/chat/DealerMatchModal.vue) `dealerProfiles` 맵).
- accept/cancel이 갱신된 채팅방을 안 주므로, 수락 성공 시 `chatApi.getRooms()`를 다시 호출해 해당 방을 찾아 `matched` 이벤트로 emit한다.
- DEALER 권한 엔드포인트(제안 생성, 내 제안 목록)는 `X-User-Id` 외에 `X-User-Role`도 보내야 해서 [src/api/client.ts](../../src/api/client.ts)에 `dealerHeaders()`를 신설.

## FE 구현 단계

### 2.1 타입
- [src/types/dealer.ts](../../src/types/dealer.ts): 신규 `ListingOffer` 타입 추가(위 스키마). 기존 `Dealer` 인터페이스와 [src/api/dealer.ts](../../src/api/dealer.ts) `getApprovedDealers()`(`GET /auth/dealers`)는 이 변경 후 **아무 데서도 쓰이지 않게 됨** — 코드 정리 대상으로 같이 제거 (사용처가 [DealerMatchModal.vue](../../src/components/chat/DealerMatchModal.vue) 하나뿐이라 안전하게 삭제 가능, grep으로 재확인 후 진행).
- [src/types/listing.ts](../../src/types/listing.ts):12-34 `Listing`을 확장하는 `MyOfferedListing` 타입 추가 (`Listing & { offeredPrice: number; offerStatus: 'PENDING'|'ACCEPTED'|'CANCELLED' }`).

### 2.2 API 모듈
- [src/api/listings.ts](../../src/api/listings.ts): `submitOffer(listingId, offerPrice)`(POST), `getOffers(listingId)`(GET), `getMyOfferedListings()`(GET `/api/listings/my-offers`) 추가.
- [src/api/chat.ts](../../src/api/chat.ts): 기존 `addDealerParticipant`(1차 수정에서 이미 미사용) 제거, `acceptOffer(roomId, offerId)`/`cancelOffer(roomId, offerId)` 추가.
- [src/api/dealer.ts](../../src/api/dealer.ts): `getApprovedDealers()` 제거 — 파일 자체가 비면 삭제, [src/api/index.ts](../../src/api/index.ts)의 export도 함께 정리.

### 2.3 `DealerMatchModal.vue` 전면 교체
[src/components/chat/DealerMatchModal.vue](../../src/components/chat/DealerMatchModal.vue):
- props에 `listingId: number` 추가(현재 `roomId`만 있음). [src/views/ChatView.vue](../../src/views/ChatView.vue):493-499의 `<DealerMatchModal>` 호출에 `:listing-id="selectedRoom?.listingId"` 추가.
- `dealerApi.getApprovedDealers()` 호출 제거, `listingsApi.getOffers(props.listingId)`로 교체.
- 목록 아이템: 딜러 프로필 사진/닉네임 + **제안 가격**(`formatManWon(offer.offerPrice)`, [src/utils/format.ts](../../src/utils/format.ts) 재사용) + "수락"/"취소" 버튼 2개(기존엔 클릭 한 번으로 즉시 매칭 → 이제는 행마다 버튼 2개).
- "수락" 클릭 → 확인 모달([useConfirmModal](../../src/composables/useConfirmModal.ts), 기존 패턴 유지) → `chatApi.acceptOffer(roomId, offer.id)` → 성공 시 기존과 동일하게 `matched` 이벤트 emit, 모달 닫기.
- "취소" 클릭 → 확인 모달 → `chatApi.cancelOffer(roomId, offer.id)` → 성공 시 목록에서 해당 항목 제거(로컬 상태 갱신, 재조회 없이 — 신고 관리 탭 패턴과 동일).
- 빈 상태 문구를 "활동 중인 공인중개사가 없어요" → "아직 이 매물에 가격을 제안한 공인중개사가 없어요"로 변경.
- 이미 매칭된 경우(`matchedDealerName` 있음) 표시는 기존과 동일하게 유지.

### 2.4 `OfferModal.vue` 신규 (매물 상세 — 딜러 전용 가격 제안)
신규 `src/components/listing/OfferModal.vue` — [ConfirmModal.vue](../../src/components/ui/ConfirmModal.vue)의 Teleport+backdrop+150ms 패턴을 그대로 따르되 본문에 숫자 입력 필드(복비) 1개:
- props: `listingId: number`, `initialPrice?: number`(이미 제안한 가격이 있으면 prefill — 2.5 참고).
- 제출 시 `listingsApi.submitOffer(listingId, price)` 호출 → 성공 시 emit `submitted` 이벤트(상위에서 버튼 라벨/금액 갱신용) → 모달 닫기.
- 백엔드가 재제안을 "덮어쓰기"로 처리하므로(표에 명시됨), 버튼은 항상 활성 상태로 유지하고 라벨만 "가격 제안하기" ↔ "제안 수정하기"로 전환한다. *(참고: plan 인터뷰 중 "이미 제안 있으면 버튼 숨김"으로 1차 답변했었으나, 직후 사용자가 준 정확한 API 설명에 "재제안 시 덮어씀"이 명시되어 있어 — 숨기면 가격을 절대 수정할 수 없게 되므로 이 계획에서는 "수정 가능하게 유지"로 뒤집었다. 실행 전 최종 확인 필요.)*

### 2.5 [ListingDetailPanel.vue](../../src/components/listing/ListingDetailPanel.vue) — 딜러 전용 "가격 제안하기" 버튼
- 438-476줄 액션 버튼 영역에 `v-if="authStore.user?.role === 'DEALER'"` 조건으로 버튼 추가(소유자/일반 구매자 액션과 분리된 별도 분기).
- 마운트 시 `listingsApi.getOffers(listing.id)`를 호출해 본인(`authStore.user.id`)이 이미 제안한 항목이 있는지 찾아 `myOffer` ref에 저장 — 있으면 버튼 라벨 "제안 수정하기 (현재 ₩{{formatManWon(myOffer.offerPrice)}})", 없으면 "가격 제안하기".
- 클릭 시 `OfferModal`을 열고 `initial-price="myOffer?.offerPrice"` 전달.
- 제출 성공(`@submitted`) 시 `myOffer` 갱신.

### 2.6 신규 `DealerOffersView.vue` — 딜러 전용 "내 제안 매물" 페이지
- 신규 `src/views/DealerOffersView.vue` — [src/views/my/MyListingsView.vue](../../src/views/my/MyListingsView.vue) 전체 구조(데이터 패칭 `run()` 패턴, 카드 레이아웃, 로딩/에러/빈 상태)를 그대로 복사해 데이터 소스만 `listingsApi.getMyOfferedListings()`로 교체.
- 카드에서 조회수/북마크 배지 제거(요구사항: "조회수나 북마크 수 같은 데이터는 딱히 필요 없음"), 대신 제안 가격 배지(`formatManWon(item.offeredPrice)`) 표시.
- [src/router/index.ts](../../src/router/index.ts):103-108(`/admin` 라우트) 패턴과 동일하게 `{ path: '/dealer/offers', name: 'dealer-offers', component: () => import('@/views/DealerOffersView.vue'), meta: { requiresAuth: true, requiresDealer: true } }` 추가.
- `beforeEach` 가드(139-153줄)에 `if (to.meta.requiresDealer && authStore.user?.role !== 'DEALER') return { name: 'home' }` 분기 추가 (`requiresAdmin` 분기, 147-149줄과 동일한 패턴).

### 2.7 [AppHeader.vue](../../src/components/layout/AppHeader.vue) — 딜러 전용 nav 탭
- 데스크톱 136-139줄("관리자" `RouterLink`) 바로 뒤에 동일 패턴으로 추가:
  ```vue
  <RouterLink v-if="authStore.user?.role === 'DEALER'" to="/dealer/offers" class="nav-link nav-link--admin">내 제안</RouterLink>
  ```
- 모바일 231-235줄 블록도 동일하게 미러링.

## Acceptance Criteria

- [ ] 매물 상세 페이지에서 `role=DEALER` 계정으로 보면 "가격 제안하기" 버튼이 보이고, 일반 유저/관리자 계정에는 보이지 않는다.
- [ ] 가격 제안 모달에서 복비를 입력하고 제출하면 `POST /api/listings/{listingId}/offers`가 호출되고, 버튼이 "제안 수정하기 (현재 ₩...)"로 바뀐다.
- [ ] 같은 매물에 다시 제안을 제출하면(가격 변경) 기존 제안이 덮어써진다 (새 항목이 중복 생기지 않음).
- [ ] 채팅방에서 "매칭하기" 클릭 시 해당 매물에 제안을 넣은 딜러들만 가격과 함께 모달에 보인다 (제안 없는 딜러는 안 보임).
- [ ] 모달에서 "수락" 클릭 시 해당 딜러가 채팅방 참가자로 추가되고(3인 전환), "취소" 클릭 시 해당 제안이 목록에서 사라진다.
- [ ] 제안을 넣은 딜러가 없으면 모달에 "아직 제안한 공인중개사가 없어요" 빈 상태가 보인다.
- [ ] `role=DEALER` 계정은 nav에 "내 제안" 탭이 보이고, 클릭하면 본인이 제안한 매물 목록(제안 가격 포함, 조회수/북마크 수 제외)이 보인다.
- [ ] `role≠DEALER` 계정으로 `/dealer/offers` 직접 접근 시 홈으로 리다이렉트된다.

## Risks and Mitigations

| 리스크 | 완화 방안 |
|---|---|
| `GET /api/listings/{listingId}/offers`가 취소/수락된 과거 제안까지 다 반환하면 매칭 모달에 잘못된 항목이 남을 위험 | FE에서 `status === 'PENDING'`만 필터링해 렌더링 (서버가 이미 필터링해도 안전한 추가 방어) — 구현됨 |
| `addDealerParticipant`/`getApprovedDealers`처럼 모델이 또 바뀌어 이번 구현도 폐기될 가능성 | 변경분을 작은 단위로 나눠 커밋(타입→API→모달→상세 버튼→딜러 페이지→nav) — 다음 변경 시 어디까지 되돌릴지 명확하게 |

## Verification Steps

1. 백엔드 5개 API를 Postman/curl로 단독 호출해 실제 응답 필드명이 위 "가정 스키마"와 일치하는지 먼저 확인.
2. 딜러 계정으로 로그인 → 매물 상세에서 "가격 제안하기" → 가격 입력 → 제출 → 버튼이 "제안 수정하기"로 바뀌는지 확인.
3. 같은 딜러 계정으로 동일 매물에 다른 가격 재제안 → `/dealer/offers`에서 가격이 갱신됐는지(중복 안 생기는지) 확인.
4. 일반 유저 계정으로 해당 매물 판매자/구매자와 채팅방 진입 → "매칭하기" → 제안한 딜러와 가격이 보이는지 확인.
5. "수락" → 딜러가 채팅방에 3번째 참가자로 들어오는지, 채팅방을 나갔다 들어와도 유지되는지 확인.
6. 다른 제안에 "취소" → 목록에서 사라지는지, 해당 딜러의 `/dealer/offers`에서도 상태가 반영되는지 확인.
7. `role=USER`/`role=ADMIN` 계정으로 `/dealer/offers` 직접 URL 접근 시 홈 리다이렉트 확인.

## 미해결 결정 사항

1. ~~"이미 제안한 가격이 있을 때 버튼을 숨길지, 수정 가능하게 둘지"~~ — "항상 노출 + 수정 가능"으로 사용자 확인 완료, 구현됨.
2. ~~`ListingOffer`/`MyOfferedListing`의 정확한 응답 필드명~~ — 사용자가 실제 스키마 제공, 전부 반영 완료 (`price`, `myOfferPrice`, `X-User-Role` 헤더 등).
3. 한 매물에 여러 채팅방이 걸려 있을 때, 한 곳에서 제안을 수락하면 다른 방에서도 그 제안이 사라지는지/유지되는지 — 백엔드 동작 미확인, FE는 매칭 모달을 열 때마다 최신 목록을 재조회하므로 어느 쪽이든 화면엔 반영됨.
