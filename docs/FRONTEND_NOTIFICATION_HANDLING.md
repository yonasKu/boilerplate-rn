# Frontend Push Notification Handling Guide

This document explains how to handle push notification taps and deep link users into the right screen.

Applies to Expo Router setup (see `src/app/_layout.tsx`). Adjust navigation paths to your routes.

---

## 1) Prerequisites (already present in project)

- Token management lives in `src/services/notifications/NotificationService.ts`.
- Ensure you request permission and register the device token on login/app start:
  - `NotificationService.requestPermissions()`
  - `NotificationService.getPushToken()`
  - `NotificationService.registerDeviceToken(userId, token)`

Backend sends data payloads like:
- `recap_comment`: `{ type: 'recap_comment', recapId, commentId }`
- `recap_like`: `{ type: 'recap_like', recapId, likerId }`

---

## 2) Add response listeners at app root

Where: your app root (e.g., `src/app/_layout.tsx` or a top-level provider).

Goals:
- Handle taps when app is backgrounded/foregrounded
- Handle cold start (app launched via tap)

Implementation detail: set up a tap listener and a cold-start check at app root to route by `data.type` and `recapId`.

Usage: mount once in `src/app/_layout.tsx` so it persists across navigation.

Notes:
- For React Navigation (non expo-router) use a navigation ref and `navigationRef.navigate('RecapDetail', { recapId })`.
- Keep the listener at a stable root so it isn’t re-registered on every screen.

---

## 3) Optional: Foreground notifications UX

If a relevant notification arrives while the app is active, show an in-app banner/toast with an “Open” action that routes to the recap.

This is optional because the default handler already surfaces an alert. Customize per your UX.

---

## 4) Testing checklist

- Device receives a push with `data.type` set to `recap_comment` or `recap_like`.
- Tapping the notification opens the app and navigates to the Recap detail screen for `recapId`.
- Cold start: kill the app, tap the notification, ensure navigation still works.
- Comment/like your own recap should not notify (handled server-side).
- Disable preferences (if you add client UI for them) and verify no notification is delivered.

---

## 5) Common pitfalls

- Not registering listeners at the app root → taps not handled on some screens.
- Route path mismatch → adjust `router.push({ pathname: '/recaps/[id]', params: { id } })` to your actual route.
- Missing token registration on login → backend can’t deliver notifications.
- iOS: notifications require a physical device and APNs setup.

---

## 6) Where to change things

- Listener hook: add in `src/app/_layout.tsx` or a root provider.
- Routing target: if your Recap detail is at a different path or uses a screen name, edit the `router.push(...)` (expo-router) or `navigation.navigate(...)` accordingly.

---

## 7) Backend data contract (reference)

- `recap_comment` data: `{ type: 'recap_comment', recapId: string, commentId: string }`
- `recap_like` data: `{ type: 'recap_like', recapId: string, likerId: string }`

These are emitted by `functions/functions/onRecapInteraction.js`.

---

## 8) Implementation plan summary (what to add to codebase)

- Create `src/components/ui/ToastContainer.tsx` to render a stack of `Toast` components globally.
- Extend `src/hooks/useToast.ts` to support persistent/actionable toasts: `{ persistent?: true, actionText?, onPress? }`.
- Mount `ToastContainer` at app root in `src/app/_layout.tsx`.
- Add listeners in `src/app/_layout.tsx`:
  - Foreground: `Notifications.addNotificationReceivedListener` → show toast for recap interactions.
  - Tap (background): `Notifications.addNotificationResponseReceivedListener` → navigate to recap.
  - Cold start: `Notifications.getLastNotificationResponseAsync()` → navigate to recap.
- Optional: Create `src/services/notifications/notificationToastMapper.ts` to map `data.type` → toast content and route.

---

## 9) Checklist: In‑app banner (toast) for foreground notifications

- [ ] Create `ToastContainer` that:
  - [ ] Accepts `toasts` from `useToast()` and renders top overlay using existing `Toast` UI (`src/components/ui/Toast.tsx`).
  - [ ] Supports multiple toasts queued.
  - [ ] Handles `onClose` and optional `onAction` (Open) per toast.
- [ ] Extend `useToast`:
  - [ ] Add options: `persistent?: boolean`, `actionText?: string`, `onPress?: () => void`.
  - [ ] If `persistent: true`, do not auto-dismiss. Require `onClose()`.
  - [ ] Keep default duration longer (e.g., 5000–8000ms) for non-persistent.
- [ ] Mount `ToastContainer` in `src/app/_layout.tsx` so it overlays all screens.
- [ ] Foreground listener in `src/app/_layout.tsx`:
  - [ ] `Notifications.addNotificationReceivedListener` parses `notification.request.content.data`.
  - [ ] For `type === 'recap_comment' | 'recap_like'`, call `showToast({ title, message, persistent: true, actionText: 'Open', onPress: () => router.push(...) })`.
  - [ ] Ensure SafeArea styling so toast doesn’t collide with headers/notches.
- [ ] Optional mapping util (`notificationToastMapper.ts`) to centralize toast text and navigation targets.

---

## 10) Checklist: Push notification tap handling (background/closed)

- [x] In `src/app/_layout.tsx`, add `useNotificationResponseListener()` hook:
  - [x] `Notifications.addNotificationResponseReceivedListener` (background → opened).
  - [x] `Notifications.getLastNotificationResponseAsync` (cold start).
  - [ ] Read `data = response.notification.request.content.data`.
  - [ ] If `data.type` is `recap_comment` or `recap_like`, and `data.recapId` exists:
    - [ ] Navigate: `router.push({ pathname: '/recaps/[id]', params: { id: data.recapId } })`.
- [x] Keep this hook mounted once at the app root to avoid duplicate navigation.
- [ ] Verify navigation path matches your Recap detail route.
- [ ] Ensure token registration is invoked on login/app start via `NotificationService`.

---

## 11) QA checklist

- [ ] Foreground: Receive recap comment/like notification while app is open → toast appears with Open action → tapping Open routes to correct recap.
- [ ] Background: Tap notification → app opens and routes to recap.
- [ ] Cold start: Kill app, tap notification → app launches and routes to recap.
- [ ] Self-actions (liking/commenting on own recap) do not notify (server-side behavior).
- [ ] Disable preferences for comment/like notifications and confirm none are received (if UI exists; server-side preferences already respected).
- [ ] Debounce: Multiple rapid likes should not flood toasts (optional enhancement).
- [ ] iOS and Android both tested on physical devices.

---

## 12) Example implementations

This section intentionally omits code snippets for brevity. Implementations should:

- ToastContainer: Render queued toasts at the top using existing `Toast` UI and respect safe areas.
- useToast: Support `persistent`, `actionText`, and `onPress`; auto-dismiss only when not persistent.
- Foreground listener: On receiving a recap interaction while app is active, show a persistent toast with an “Open” action that navigates to the recap.
- Mapper (optional): Centralize `data.type` → title/message mapping for `recap_comment`, `recap_like`, and `daily_reminder`.

---

## 13) Final consolidated checklist

- [ ] Root listeners implemented: tap + cold start navigation
- [ ] Foreground listener shows persistent toast with Open action
- [ ] `ToastContainer` mounted at root and renders multiple toasts
- [ ] `useToast` supports persistent and action callbacks
- [ ] Mapper (optional) for consistent titles/messages
- [ ] Safe areas respected; banners don’t overlap headers
- [ ] Recap detail route verified (`/recaps/[id]` or your actual path)
- [ ] End-to-end tested on iOS and Android real devices

