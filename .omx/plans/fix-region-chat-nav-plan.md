# Fix Region Filtering, Chat Badge Sync, and Profile Nav

## Requirements Summary

- Region chips must actually constrain listing and market results.
- Chat unread badge in the navbar must update while the chat page is open, especially after the current room is read.
- Navbar must expose "내정보" as a clear link to `/my/profile`.

## Current Evidence

- Listing filter emits `regions` and keyword/address values from `src/components/listing/FilterBar.vue:54`.
- Listing results pass the filter to `/api/listings` through `src/components/listing/ListingListPanel.vue:37` and `src/api/listings.ts:6`.
- Market filter emits `regions` from `src/components/market/MarketFilterBar.vue:59`.
- Market results pass the filter to `/api/market` through `src/components/market/MarketListPanel.vue:32` and `src/api/market.ts:6`.
- Axios serializes arrays as repeated params, `regions=a&regions=b`, in `src/api/client.ts:15`.
- Navbar unread badge uses `useUnreadChatCount()` in `src/components/layout/AppHeader.vue:18`, then displays it at `src/components/layout/AppHeader.vue:95` and `src/components/layout/AppHeader.vue:185`.
- Unread count currently refreshes only by polling every 30 seconds in `src/composables/useUnreadChatCount.ts:16`.
- Chat page marks a room as read and clears only the local room counter in `src/views/ChatView.vue:70`.
- Chat websocket updates only the ChatView-local room state in `src/views/ChatView.vue:34`.
- `/my/profile` route already exists in `src/router/index.ts:65`.
- Header currently links the user nickname/email to `/my/profile` in `src/components/layout/AppHeader.vue:110` and mobile menu in `src/components/layout/AppHeader.vue:201`, but does not label it as "내정보".

## Acceptance Criteria

- Selecting a region chip changes the outgoing request params for listing and market result fetches.
- The backend receives the exact region value format it expects. If backend expects exact province names, region constants must use canonical Korean values such as `서울`, `경기`, `인천`, not display-only group labels.
- Clearing/selecting "전체" removes region params from the next request.
- After entering a chat room, navbar unread badge drops immediately without browser refresh once `markAsRead` succeeds.
- While ChatView is open, messages in the currently selected room do not leave the global navbar badge stale.
- Messages arriving in a non-selected room increment both the room badge and global navbar badge without waiting for the next poll.
- Navbar has an explicit "내정보" item pointing to `/my/profile` on desktop and mobile authenticated menus.
- Existing `/my/profile` route remains unchanged and still renders `MyProfileView`.

## Implementation Steps

1. Confirm API parameter contract for region filtering.
   - Inspect existing backend notes in `.omc/plans/backend-request-region-filter.md` before editing.
   - Decide whether frontend should send `regions`, `region`, `city`, or `districtCode`.
   - If the backend contract is unavailable locally, preserve current `regions` param shape and fix frontend value propagation only.

2. Normalize reusable region constants.
   - Create or reuse a shared frontend constant for listing and market region chips.
   - Replace duplicate `REGIONS` definitions in `src/components/listing/FilterBar.vue:15` and `src/components/market/MarketFilterBar.vue:14`.
   - Keep display labels separate from request values so grouped labels like `수도권` can map to multiple canonical values.

3. Verify region params reach API calls.
   - In `ListingListPanel`, ensure `onFilterUpdate` does not preserve stale region arrays when "전체" is selected at `src/components/listing/ListingListPanel.vue:50`.
   - In `MarketListPanel`, ensure `onFilterUpdate` resets pagination and removes stale `regions` when undefined at `src/components/market/MarketListPanel.vue:46`.
   - Confirm `client.ts` array serialization at `src/api/client.ts:15` remains compatible.

4. Make unread chat count event-driven in addition to polling.
   - Extend `src/composables/useUnreadChatCount.ts` with explicit mutators such as `setUnreadCount`, `incrementUnreadCount`, `decrementUnreadCount`, or `syncUnreadCountFromRooms`.
   - Keep polling as a fallback, but use local events for immediate navbar updates.

5. Sync ChatView read/message events to global unread count.
   - In `selectRoom`, after `chatApi.markAsRead(room.id)` succeeds at `src/views/ChatView.vue:70`, subtract or resync the selected room's previous unread count before setting `room.unreadCount = 0`.
   - In websocket callback at `src/views/ChatView.vue:34`, if the message belongs to the selected room, keep the global unread count unchanged and optionally call `markAsRead` if backend increments unread on delivery.
   - If the message belongs to a different room, increment both `target.unreadCount` and the global unread count.
   - Consider calling `refreshUnreadCount()` after `markAsRead` as the simplest correctness-first option if backend unread behavior is uncertain.

6. Add explicit "내정보" navigation text.
   - Change authenticated desktop header from nickname-only link at `src/components/layout/AppHeader.vue:110` to an explicit "내정보" link, or add a separate "내정보" item before the nickname.
   - Change mobile menu link at `src/components/layout/AppHeader.vue:201` similarly.
   - Preserve responsive spacing and do not make the mobile menu wider unless needed.

7. Verification.
   - Run `yarn build`.
   - Manually verify in browser/devtools:
     - region chip click changes network query params and result list updates;
     - "전체" removes region params;
     - opening a chat room clears navbar badge immediately;
     - receiving a message in another room increments navbar badge without refresh;
     - desktop and mobile nav show "내정보" and route to `/my/profile`.

## Risks and Mitigations

- Backend may not support the current `regions` param. Mitigation: inspect backend contract or request logs first; keep frontend changes isolated so the param name can be swapped in one place.
- Backend may increment unread counts even for the active room. Mitigation: after active-room messages or `markAsRead`, prefer server resync if local arithmetic conflicts.
- Existing files have pending user changes. Mitigation: edit only the named files and preserve unrelated diffs.

## Stop Condition

Stop when build passes and the three user-visible behaviors are verified: region filtering applies, chat badge updates without refresh, and "내정보" routes to `/my/profile`.
