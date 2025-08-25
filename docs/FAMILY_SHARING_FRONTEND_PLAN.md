# Family Sharing – Frontend Implementation Plan

## Summary
Implement view-only family sharing so owners can invite viewers who can read recaps/journal and react/comment (scoped), with upgrade path.

## Scope and Roles
- Owner: full access, manages invites and scopes.
- Viewer: read-only by default; optional permissions via scopes.
- Scopes used in UI: 
  - recaps:read (default for viewers)
  - journal:read (optional)
  - comments:write (optional)
  - likes:write (optional)

## Navigation and Routes
- Entry: `Settings` → `Family Sharing`
- Screens (Expo Router suggested paths):
  - `/settings/family` → Family list + CTA to invite
  - `/settings/family/invite` → Invite by email/phone
  - `/settings/family/[viewerId]` → Manage scopes / revoke
  - `/invite/accept?code=...` → Invite acceptance route (deep link capture)
  - `/(auth)/enter-invite` → Manual code entry (fallback)

## UI Screens
- Family List Screen
  - List current viewers, their scopes, status
  - Actions: Manage, Revoke, Invite
- Invite Screen
  - Fields: email/phone, optional message
  - Action: Create invitation → returns inviteCode → Share sheet
- Viewer Detail Screen
  - Toggle scopes: journal read, comments write, likes write
  - Revoke access button
  - Save changes
- Invite Acceptance Screen (if app flow)
  - Accepts `inviteCode` → store transiently → proceed to auth if needed → after verification, accept invitation → route forward (paywall bypass)

## Components
- `ViewerListItem`: avatar, name/email, status, scopes chips
- `ScopeToggleRow`: labeled switch with helper text
- `InviteShareCard`: shows `inviteCode` with copy/share

## State Management
- Use service calls + local React Query cache (or simple state) per screen.
- Cache keys:
  - `family:viewers:{ownerId}`
  - `family:ownersViewingMe:{userId}`

## Services
- File: `src/services/familyService.ts` (current location in codebase)
- Methods (from root plan, align with memory):
  - `createInvitation(inviteeContact): Promise<string /* inviteCode */>`
  - `acceptInvitation(inviteCode): Promise<void>` (called post-auth)
  - `getFamilyMembers(ownerId): Promise<{ viewers: User[]; ownersViewingMe: User[] }>`
  - `updatePermissions(viewerId, scopes: string[]): Promise<void>`
  - `revokeAccess(viewerId): Promise<void>`
- Types: 
  - `FamilyInvitation { inviterId, inviteeContact, role: 'viewer', status, inviteCode, expiresAt, createdAt }`
  - `SharedAccess { ownerId, viewerId, scopes: string[], createdAt }`

### Additional helpers for viewer onboarding
- `hasAnySharedAccess(userId): Promise<boolean>`
- `getOwnerIds(userId): Promise<string[]>` (who granted me access)
- `getInvitationByCode(code): Promise<FamilyInvitation | null>`

## Frontend Permission Checks
- In recap/journal screens, gate actions:
  - If `comments:write` not present → hide comment input
  - If `likes:write` not present → disable like button
  - If `journal:read` not present → hide journal tab/entries for viewers
- Utility: `hasScope(sharedAccess, 'comments:write')`

## Notifications UX
- Owner gets toast/push when invite accepted
- Viewers get recap-available notifications
- Use existing `NotificationContainer` + `useNotification`

## Error Handling
- Invite creation failures (invalid phone/email)
- Invite acceptance: invalid/expired code
- Permission update conflict → optimistic UI with rollback

## Analytics
- Events: invite_create, invite_accept, scopes_update, access_revoke

## Auth Integration and Viewer Onboarding

### Goals
- Ensure invited viewers can sign up/login, verify email, and bypass paywall.
- Do not alter the standard paywall path for non-viewers.

### Flow Diagrams
- Deep link: `/invite/accept?code=ABC` → capture code → signup/login → verify-email → acceptInvitation → detect viewer → bypass paywall → `/(auth)/add-profile` → `/(auth)/add-child-details` → `/(main)/(tabs)/journal`
- Manual code: `/(auth)/enter-invite` → capture code → signup/login → verify-email → acceptInvitation → detect viewer → bypass paywall → `/(auth)/add-profile` → ...
- Already logged-in: `/invite/accept?code=ABC` → acceptInvitation → detect viewer → continue to `(main)`

### Where to integrate
- `src/app/_layout.tsx`
  - After auth state available, allow auth routes to finish.
  - Do not force-paywall if `hasAnySharedAccess(userId)` returns true.
- `src/features/auth/screens/VerifyEmailScreen.tsx`
  - After verified: if viewer → route to `/(auth)/add-profile`; else → `/(auth)/pricing`.
- Pricing and Checkout screens
  - Guard: if viewer → skip forward (e.g., route to `/(auth)/add-profile`).

### Transient invite handling
- Keep an in-memory `inviteCode` while user signs up/logs in and verifies email.
- On first screen post-verification, attempt `acceptInvitation(inviteCode)` and then clear it.

## Minimal Route Additions
- `src/app/invite/accept.tsx` (deep link landing; reads `code` from query and stores it)
- `src/app/(auth)/enter-invite.tsx` (manual entry; stores code and routes to signup/login)

## Test Plan (Frontend)
- Owner flow: create/see/revoke
- Viewer onboarding: deep link, manual entry, logged-in acceptance
- Paywall bypass: viewer skips `Pricing`/`Checkout`
- Scope toggles: commenting/liking behavior
- Empty/error states, offline UI

## Open Issues to Verify
- `LoginScreen` should route to `/(auth)/add-profile` after credentials (then child details)
- `AddProfileScreen` should route to `/(auth)/add-child-details` (path correctness)

## Codebase Alignment (current app)
- __Root layout__: `src/app/_layout.tsx` — add viewer detection and invite acceptance post-auth.
- __Verify Email__: `src/features/auth/screens/VerifyEmailScreen.tsx` — after verification, route to `/(auth)/pricing` only if not a viewer.
- __Pricing__: `src/features/auth/screens/PricingScreen.tsx` — guard to skip for viewers.
- __Service path__: use `src/services/familyService.ts` (not feature folder) and extend with helpers listed above.
- __Route corrections__:
  - `AddProfileScreen` currently navigates to `/(auth)/add-child-details` via its hook `useAddProfile()`; verify this matches router file `src/app/(auth)/add-child-details.tsx`.
  - Ensure `LoginScreen` forwards to `/(auth)/add-profile` after successful login to continue onboarding.
  - Add deep link landing `src/app/invite/accept.tsx` and optional manual entry `src/app/(auth)/enter-invite.tsx` (docs only; no code changes in this plan).

## Deliverables
- Screens, service integration, scope gating utilities, tests

---

## Deep Links (embedded reference)

### URL Formats
- App scheme: `sproutbook://invite/accept?code=INV123`
- Universal/App Link: `https://app.sproutbook.com/invite/accept?code=INV123`

### Parameters
- `code` (required): Invite code identifier
- `source` (optional): `email` | `sms` | `share`

### Expected Behavior
- If app is closed: launch app → open `/invite/accept` → store `code` transiently.
- If app is foreground/background: navigate to `/invite/accept` immediately.
- If user not authenticated: route to signup/login; keep `code` until post-auth.
- After email verification: accept invitation, then detect viewer and bypass paywall.

### Platform Notes
- iOS: Configure Associated Domains for Universal Links; ensure scheme in `app.json`.
- Android: Configure intent filters for both scheme and HTTPS host.
- Expo Router: The route file should be `src/app/invite/accept.tsx` to match paths above.

### QA Examples
- Open `sproutbook://invite/accept?code=TEST123` when logged out → see auth → verify → no paywall.
- Open HTTPS link from Mail app → app opens `/invite/accept` → proceed as above.
- Already logged in → link immediately accepts and routes to main without paywall.
