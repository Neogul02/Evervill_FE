# 백엔드 요청: 회원탈퇴 API (`DELETE /auth/account`)

## 배경
마이페이지(`/my/profile`)에 닉네임/비밀번호 변경은 이미 구현되어 있었고, 이번에 "회원탈퇴" 섹션을 추가했습니다. 프론트는 비밀번호 재확인 후 `DELETE /auth/account`를 호출하도록 구현해뒀는데, 이 엔드포인트가 아직 백엔드에 없습니다.

## 요청 사항

**엔드포인트:** `DELETE /auth/account`

**요청 헤더:** 기존 인증 패턴과 동일 (Access Token / `X-User-Id` 등 현재 적용 중인 인증 방식 그대로)

**요청 바디:**
```json
{ "password": "현재 비밀번호" }
```

**동작:**
1. 토큰에서 추출한 사용자 본인 계정인지 확인
2. 바디의 `password`가 현재 비밀번호와 일치하는지 검증 (불일치 시 401/400 + 에러 메시지)
3. 검증 성공 시 계정 삭제(또는 소프트 삭제) 처리

**응답:**
```json
{ "success": true, "message": "OK", "data": null }
```
실패 시 다른 API와 동일한 에러 포맷 (`message`에 사용자에게 보여줄 문구) 유지해주시면 프론트에서 그대로 노출합니다.

## 결정이 필요한 부분 (정책 확인 요청)
탈퇴한 사용자가 남긴 데이터를 어떻게 처리할지 정해주셔야 합니다 — 둘 중 택1 또는 혼합:

1. **하드 삭제**: 계정 row 자체를 삭제. 이 경우 해당 유저가 등록한 매물(`listings`), 채팅방/메시지, 북마크 등 연관 데이터의 FK 처리(cascade delete vs null 처리)를 결정해야 함.
2. **소프트 삭제(권장)**: `status = WITHDRAWN` 같은 플래그만 세우고 로그인은 막되, 매물/채팅 기록은 "탈퇴한 사용자"로 표시해 보존. 채팅 상대가 갑자기 메시지 작성자가 사라진 것처럼 보이는 문제를 피할 수 있음.

프론트는 어느 쪽이든 추가 변경 없이 그대로 동작합니다 (탈퇴 후 `authStore.logout()` 호출 + 홈으로 리다이렉트만 수행).

## 프론트 현황 (참고용, 이미 완료됨)
- [src/api/auth.ts](../../src/api/auth.ts): `authApi.deleteAccount({ password })` 추가, `DELETE /auth/account`에 `{ password }`를 바디로 전송
- [src/views/my/MyProfileView.vue](../../src/views/my/MyProfileView.vue): "회원탈퇴" danger-zone 섹션 추가 — 비밀번호 입력 + 확인 다이얼로그(`confirm()`) → API 호출 → 성공 시 `authStore.logout()` 후 `/`로 이동, 실패 시 에러 메시지 표시
- 같은 화면 상단에 닉네임/이메일/가입일을 보여주는 "계정 정보" 카드도 추가했고, 네비게이션(헤더의 닉네임 링크 → `/my/profile`)은 기존에 이미 연결되어 있어 추가 라우팅 작업은 필요 없었습니다.
