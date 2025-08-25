# Family Sharing – Viewer Signup/Login and Paywall Bypass

## Goal
Allow invited family/friends to join as view-only “viewer” accounts without hitting a paywall, while full members follow normal onboarding/subscription.

## Definitions
- **Owner**: full account, pays, shares content.
- **Viewer**: invited, view-only by default; may have allowed interactions via scopes.
- **Invitation**: `invitations` doc with `inviteCode`, `status`, `inviterId`, `expiresAt`.
- **Access**: `sharedAccess` doc with `ownerId`, `viewerId`, `scopes`.

---

## A) How the app knows a user is a Viewer (not a regular member)

- **Option 1: Presence of sharedAccess (Recommended)**
  - After auth, query `sharedAccess` for `viewerId == auth.uid`.
  - If any record exists → user is a viewer for at least one owner.
  - Pros: simple; supports multiple owners; dynamic.
  - Cons: requires Firestore read on start.

- **Option 2: Custom Claims**
  - On accepting invitation, a Cloud Function sets a custom claim: `{ role: 'viewer' }` and optionally `{ owners: [ownerIds...] }`.
  - Pros: available immediately on token; useful for Rules; quick gating.
  - Cons: token refresh needed after claim changes; keep in sync with Firestore.

- **Option 3: Local Flag Only (Not sufficient)**
  - Deep-link param sets local state; not durable beyond sign-in or device changes.
  - Use only as a hint before acceptance completes.

Recommended: Use Option 1 + optionally mirror to custom claims for faster gating.

---

## B) How invited families sign up or log in

- **Flow 1: Deep Link with inviteCode (Best UX)**
  1) Owner sends invite link: `myapp://invite/accept?code=INV123` or `https://app.domain/accept?code=INV123`.
  2) App opens Invite Acceptance screen.
  3) If user is not authenticated → sign in/up screen → after auth, continue acceptance.
  4) Call backend `acceptInvitation(inviteCode)`.
  5) Backend validates and creates `sharedAccess` with default scopes, marks invitation `accepted`.
  6) Frontend routes to viewer home (recaps/journal), bypassing paywall.

- **Flow 2: Manual Code Entry**
  1) User installs app → taps "I have an invite".
  2) Enters invite code → signs in/up → acceptance continues as above.

- **Flow 3: Existing Users Become Viewers**
  - Already signed-in user taps invite link → directly accepts → receives viewer access without new account.

---

## C) Paywall bypass logic

- **Rule**: If user is a viewer for at least one owner, do not block with paywall.
  - Check on app start and post-login:
    - Query `sharedAccess` where `viewerId == auth.uid`.
    - If any record exists → set `isViewer = true` and store `viewerOwners`.
  - Paywall guard:
    - If `isViewer` → bypass paywall, but restrict creation/editing features.
    - If not viewer and no active subscription → show paywall as usual.

- **Edge cases**
  - Viewer with multiple owners: still bypass paywall.
  - Viewer upgrades to full member: subscription enables creation features but keep viewer access to owners’ content.
  - Revoked access: re-run viewer check; if no `sharedAccess`, revert to regular flow and paywall may apply.

---

## D) Frontend implementation outline

- **Routes**
  - `/invite/accept?code=...` – deep link accept screen (captures code).
  - `/(auth)/enter-invite` – manual code entry (fallback).
  - Startup/auth flow: viewer detection before paywall gate.

- **State**
  - `auth.user` (Firebase Auth)
  - `viewerState`: { isViewer: boolean; ownerIds: string[] }
  - `inviteCode` (transient, in-memory) retained across signup/login and verification

- **Guards**
  - App root or onboarding gate calls `familyService.hasAnySharedAccess(userId)` which checks `sharedAccess`.
  - If viewer → set `viewerState.isViewer=true` and bypass subscription screens.

- **UI gating**
  - Hide journal compose for viewers.
  - Disable comment/like if scopes absent.

---

## E) Backend support required

- **Functions**
  - `family-acceptInvitation(inviteCode)`:
    - Validate invite, ensure not expired, status pending, inviter != viewer.
    - Create/merge `sharedAccess` with default scopes `['recaps:read']`.
    - Update invite status to `accepted`.
    - Optional: set custom claim `role: 'viewer'`, `owners: [ownerId]`.

- **Firestore Rules** (outline)
  - Viewers can read owners’ recaps/journal if `sharedAccess(ownerId, viewerId)` exists.
  - Viewers can write likes/comments only if scope set.

---

## F) Options matrix

- **Invite transport**
  - Deep link URL with code (preferred)
  - Manual code entry

- **Viewer detection**
  - SharedAccess query (preferred)
  - Custom claims mirror (optional acceleration)

- **Paywall check**
  - Gate by subscription unless `isViewer` is true

- **Upgrade path**
  - Viewer sees soft CTA to upgrade; paywall only for creation features

---

## G) Pseudocode snippets

```ts
// After login
const isViewer = await familyService.hasAnySharedAccess(auth.uid);
setViewerState({ isViewer, ownerIds: isViewer ? await familyService.getOwnerIds(auth.uid) : [] });

// Paywall guard
if (!viewerState.isViewer && !subscription.active) {
  router.replace('/paywall');
} else {
  router.replace('/home');
}

// Invite acceptance (frontend)
await familyService.acceptInvitation(inviteCode);
// then refresh viewer state and route to viewer home
```

---

## H) QA checklist
- Deep link → auth → accept → routes to viewer home without paywall
- Manual code → auth → accept → viewer home without paywall
- Viewer cannot create journal/recaps; can view per scopes
- Revoked access removes viewer bypass
- Upgrade to full member enables creation/premium features

---

## I) Auth Integration specifics (signup-time paywall)

- __Where to hook__: `src/app/_layout.tsx` after Firebase auth state resolves, before any paywall/subscription routing.
  - Step 1: If an `inviteCode` exists (from deep link or local temp store), call `familyService.acceptInvitation(code)` post-auth, then clear it.
  - Step 2: Call `familyService.hasAnySharedAccess(auth.uid)`.
  - Step 3: If true → set `viewerState.isViewer = true` and bypass paywall routing.
  - Step 4: If false → proceed to subscription check and paywall route if needed.

- __Deep link route__: `/invite/accept?code=...`
  - If not signed in: save `inviteCode` in a transient store (in-memory) and redirect to login/signup.
  - After successful auth: read stored code and accept as in Step 1.

- __Signup screen CTA__: Add “I have an invite”
  - Navigates to a code entry screen if no deep link present.
  - On submit, follow the same accept-then-detect flow.

- __Bypass rule during signup__: Never show the paywall until viewer detection has run. Only route to paywall if `!isViewer && !subscription.active`.

---

## K) Service helpers (aligns with frontend plan)

- File path: `src/services/familyService.ts`
- Helpers required by this flow:
  - `hasAnySharedAccess(userId): Promise<boolean>` — viewer detection gate.
  - `getOwnerIds(userId): Promise<string[]>` — owners granting access (optional UI use).
  - `getInvitationByCode(code): Promise<FamilyInvitation | null>` — optional validation before accept.
  - `acceptInvitation(inviteCode): Promise<void>` — execute after auth and verification.

## L) Transient invite handling

- Keep the `inviteCode` in a transient, in-memory holder during signup/login/verification.
- Clear the code immediately after a successful `acceptInvitation`.
- Survives screen transitions but not app restarts (acceptable; deep link can be tapped again).

## M) Minimal route additions (docs only)

- `src/app/invite/accept.tsx` — deep link landing; reads `code` and stores it transiently.
- `src/app/(auth)/enter-invite.tsx` — manual code entry; stores code then routes to signup/login.

---

## J) Implementation checklist

- [ ] Add `/invite/accept` screen and deep link handling to capture `inviteCode` pre-auth
- [ ] Add transient storage for `inviteCode` through auth (e.g., context)
- [ ] Implement `familyService.ts`: `acceptInvitation`, `hasAnySharedAccess`, `getOwnerIds`
- [ ] `_layout.tsx`: post-auth viewer detection and conditional paywall bypass
- [ ] Auth screens: “I have an invite” entry and manual code flow
- [ ] UI gating for viewers (comment/like/journal create)
- [ ] QA flows (deep link, manual, existing user)
