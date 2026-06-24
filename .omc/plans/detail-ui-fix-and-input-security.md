# 매물 상세/채팅 UI 보정 + 입력값 보안 강화 (pending approval)

## Requirements Summary

두 갈래 작업:

1. **UI 보정** (직접 구현 가능한 범위): 매물 상세의 조회수 블록이 최근 팀원 리팩토링(`58341bb`)에서 사라졌고, 채팅의 매물 배너/발신자 표시가 너무 작음.
2. **입력값 보안 강화** (조사 기반 계획): 클라이언트 측에 숫자 입력 범위 제한(음수/`int` 오버플로 방지), 텍스트 길이 제한, 닉네임 예약어/스크립트 패턴 차단이 전혀 없음. 조사 결과 `v-html` 사용처는 없어 템플릿 보간을 통한 XSS 위험은 없지만(Vue가 기본적으로 `{{ }}` 출력을 escape), 숫자/문자 입력의 범위·형식 검증 부재는 실제 버그(음수 가격, `Number.MAX_SAFE_INTEGER` 입력 시 백엔드 `int` 오버플로 등)로 이어질 수 있음.

## Acceptance Criteria

### A. UI 보정
- [ ] [ListingDetailPanel.vue:298-311](src/components/listing/ListingDetailPanel.vue:298) "기본 정보" 그리드가 다시 4열(`grid-cols-4`)이 되고, 면적/층수/조회수/등록일 순으로 표시된다 (`detail.viewCount` 사용).
- [ ] [ChatView.vue:338-356](src/views/ChatView.vue:338) 매물 정보 배너의 썸네일이 `w-11 h-11` → `w-14 h-14`로 커지고, 제목/가격 텍스트가 `text-xs` → `text-sm`으로 커진다.
- [ ] [ChatView.vue:381-396](src/views/ChatView.vue:381) 메시지 발신자 아바타가 `w-4 h-4` → `w-6 h-6`, 닉네임 폰트가 `text-[11px]` → `text-xs`로 커진다.

### B. 입력값 보안 강화
- [ ] 신규 공유 유틸 `src/utils/validation.ts`에 `clampNumber(value, min, max)`, `NICKNAME_PATTERN`, `RESERVED_NICKNAMES`, `containsUnsafePattern(value)` 정의.
- [ ] [ListingCreateView.vue](src/views/ListingCreateView.vue), [ListingEditView.vue](src/views/ListingEditView.vue)의 `price`/`monthlyRent`/`area`/`floor` `<input type="number">`에 `min`/`max` 속성 추가 + 제출 시(`onSubmit`) `clampNumber`로 재검증(HTML `min`/`max`는 우회 가능하므로 JS 검증 필수).
  - price/monthlyRent: `min=0`, `max=2000000000` (백엔드가 `int`로 받을 가능성을 가정해 `Integer.MAX_VALUE`(2,147,483,647) 미만으로 여유 제한)
  - area: `min=0`, `max=100000`
  - floor: `min=-10`(지하 허용), `max=200`
  - 음수/빈값/`NaN` 입력 시 제출 차단 + 에러 메시지 표시.
- [ ] 자유 텍스트 입력에 `maxlength` 추가:
  - [ChatView.vue:429-434](src/views/ChatView.vue:429) `newMessage` → `maxlength="1000"`
  - [ListingCreateView.vue:191-196](src/views/ListingCreateView.vue:191), [ListingEditView.vue](src/views/ListingEditView.vue) `description` → `maxlength="2000"`
  - [ListingDetailPanel.vue:445-450](src/components/listing/ListingDetailPanel.vue:445) `reportReason` → `maxlength="500"`
  - [AdminView.vue:213-218](src/views/AdminView.vue:213) 공지 내용 → `maxlength="5000"`
- [ ] [RegisterView.vue:73-74](src/views/RegisterView.vue:73), [MyProfileView.vue](src/views/my/MyProfileView.vue) 닉네임 변경 입력에 `maxlength="20"` + 제출 시 `NICKNAME_PATTERN`(한글/영문/숫자/언더스코어, 2-20자) 검증 + `RESERVED_NICKNAMES`(`admin`, `administrator`, `관리자`, `root`, `system` 등) 대소문자 무관 차단 + `<`, `>`, `script` 등 패턴 차단(`containsUnsafePattern`).
- [ ] `npx vue-tsc -b` 통과.

## Implementation Steps

### A. UI 보정
1. [ListingDetailPanel.vue:300](src/components/listing/ListingDetailPanel.vue:300) `grid grid-cols-3` → `grid grid-cols-4`로 변경, `info` 배열에 `{ label: '조회수', value: String(detail.viewCount) }`를 면적/층수 다음, 등록일 앞에 삽입.
2. [ChatView.vue:343](src/views/ChatView.vue:343) 썸네일 `w-11 h-11` → `w-14 h-14`. [ChatView.vue:353-354](src/views/ChatView.vue:353) `text-xs` → `text-sm`.
3. [ChatView.vue:385](src/views/ChatView.vue:385) 아바타 `w-4 h-4` → `w-6 h-6` (내부 `UserRound` 아이콘도 `w-2.5 h-2.5` → `w-3.5 h-3.5`로 비례 조정). [ChatView.vue:393](src/views/ChatView.vue:393) 닉네임 `text-[11px]` → `text-xs`.

### B. 입력값 보안 강화
4. `src/utils/validation.ts` 신규 작성:
   ```ts
   export function clampNumber(value: number, min: number, max: number): number {
     if (!Number.isFinite(value)) return min
     return Math.min(Math.max(value, min), max)
   }
   export const NICKNAME_PATTERN = /^[a-zA-Z0-9가-힣_]{2,20}$/
   export const RESERVED_NICKNAMES = ['admin', 'administrator', 'root', 'system', '관리자', '운영자']
   export function isReservedNickname(nickname: string): boolean {
     return RESERVED_NICKNAMES.includes(nickname.trim().toLowerCase())
   }
   export function containsUnsafePattern(value: string): boolean {
     return /<|>|javascript:|on\w+\s*=/i.test(value)
   }
   ```
5. [ListingCreateView.vue:125-162](src/views/ListingCreateView.vue:125)에 각 input에 `min`/`max` 속성 추가, [ListingCreateView.vue:44-48](src/views/ListingCreateView.vue:44) `onSubmit` 시작부에 `clampNumber` 적용 + 음수/NaN이면 `error.value` 표시 후 `return`. [ListingEditView.vue]도 동일 패턴 적용.
6. [ChatView.vue:429-434](src/views/ChatView.vue:429), 매물/공지/신고 textarea에 `maxlength` 속성 추가 (HTML `maxlength`는 입력 자체를 막아주므로 JS 검증 불필요, 단 paste로 우회 가능한 경우 `handleSend`/제출 함수에서 `.slice(0, N)` 보강).
7. [RegisterView.vue:32-36](src/views/RegisterView.vue:32) `onRegister`에 닉네임 검증 추가: 입력이 있을 때만 `NICKNAME_PATTERN.test()`, `isReservedNickname()`, `containsUnsafePattern()` 체크 후 실패 시 `error.value` 설정. [MyProfileView.vue](src/views/my/MyProfileView.vue) `updateNickname` 함수에도 동일 검증 추가.

## Risks and Mitigations

- **클라이언트 검증은 우회 가능** (devtools로 속성 제거, curl 직접 호출 등) — 실제 보안 경계는 백엔드에 있어야 함. 이 작업은 UX 개선(실수로 음수/거대값 입력 방지)이지 보안 경계 자체가 아님 — 백엔드 검증 여부는 별도 확인 필요(이번 세션에서 다루지 않음).
- **`maxlength` paste 우회**: HTML `maxlength`는 일부 브라우저에서 붙여넣기 시 적용이 늦게 될 수 있어, 제출 시점에 `.slice(0, N)`으로 한 번 더 자른다.
- **기존 닉네임 데이터와의 충돌**: 이미 가입된 사용자 중 패턴에 안 맞는 닉네임이 있을 수 있음 — 이 검증은 신규 가입/변경 시점에만 적용되고 기존 데이터는 건드리지 않음.

## Verification Steps

1. `npx vue-tsc -b` 통과 확인.
2. 매물 상세에서 조회수가 4번째 칸에 정상 표시되는지 확인.
3. 채팅방 진입 후 매물 배너/발신자 아바타·닉네임이 커진 것을 시각적으로 확인.
4. 매물 등록 폼에서 가격에 `-1`, `99999999999` 입력 시 제출이 막히고 에러 메시지가 뜨는지 확인.
5. 회원가입에서 닉네임 `admin`, `<script>`, 21자 이상 문자열 입력 시 제출이 막히는지 확인.
6. 채팅 메시지/매물 설명/신고 사유에 제한 글자수 이상 입력 시 더 이상 입력되지 않는지 확인.

## Changelog
- 최초 작성 (direct mode). UI 부분은 명확한 회귀 수정, 보안 부분은 조사 기반으로 구체적 파일/라인/수치 명시.
- 구현 완료: A(UI 보정), B(입력값 보안 강화) 전체 적용, `npx vue-tsc -b` 통과.
