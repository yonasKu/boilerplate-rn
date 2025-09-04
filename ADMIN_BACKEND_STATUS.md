# Admin Backend Status & Integration Plan

Last updated: 2025-09-03

## Summary
- We aligned admin backend to HTTP v2 functions (onRequest) and added admin endpoints.
- Firestore rules now include isAdmin() and admin-only collections.
- Next: bootstrap super-admin(s), restrict role-change endpoint to super-admin, wire the web admin, deploy, and test.

## Implemented in this iteration

- __HTTP v2 Admin Endpoints__ (ID token required; audit logging):
  - File: `functions/functions/http/admin.js`
  - Exported via: `functions/index.js`
  - Endpoints:
    - `adminSetAdminRole` — set/unset admin on target user; mirrors to `users/{uid}`; logs in `admin_audit_logs`.
    - `adminCreatePromoCode` — create promo/gift code; supports validity window, max uses; logs audit.
    - `adminDisablePromoCode` — deactivate a promo code; logs audit.

- __Export wiring__
  - File: `functions/index.js`
  - Added:
    - `exports.adminSetAdminRole = adminHttp.adminSetAdminRole;`
    - `exports.adminCreatePromoCode = adminHttp.adminCreatePromoCode;`
    - `exports.adminDisablePromoCode = adminHttp.adminDisablePromoCode;`

- __Firestore rules updates__
  - File: `firestore.rules`
  - Added helper: `isAdmin()` (custom claim `admin` OR Firestore `users/{uid}.role === 'admin'` OR `isAdmin === true`).
  - `users/{userId}`: allow `read, list` for admins (in addition to owner/backend).
  - Admin-only collections:
    - `admin_audit_logs/*`
    - `analytics/{scope}/{docId}`
    - `reports/{reportId}`

- __Decision: HTTP over callable__
  - Project already standardizes on HTTP v2 handlers (see `functions/functions/http/*`).
  - Callable versions exist (e.g., `functions/functions/callable/referrals.js`) but are not exported/used.

## Security model (current)

- __Admin detection__
  - Prefer custom claim `admin: true`; fallback to Firestore mirror `users/{uid}.role === 'admin'` or `isAdmin === true`.
- __Authentication for endpoints__
  - Authorization: `Bearer <ID_TOKEN>`; verified server-side via Admin SDK.
- __Audit logging__
  - All privileged actions write to `admin_audit_logs` (admin-only via rules).

## Remaining integration tasks

- __Bootstrap super admin(s)__
  - Choose approach:
    - ENV allowlist in `functions/.env` (e.g., `SUPER_ADMINS=founder@company.com`), or
    - One-off bootstrap script in `functions/scripts/` to set `super_admin: true` and `admin: true` claims on seed accounts, and mirror in `users/{uid}`.

- __Restrict role changes to super-admin__
  - Update `adminSetAdminRole` to require `decoded.super_admin === true` OR email-allowlist match.
  - Keep audit logging for every change.

- __Web admin client integration__
  - Create `AdminApi` client (fetch + ID token) with wrappers for:
    - `adminSetAdminRole({ targetUid, makeAdmin })`
    - `adminCreatePromoCode({ code?, type?, compDays?, maxUses?, validFrom?, validUntil?, isActive? })`
    - `adminDisablePromoCode({ code })`
  - After changing a user’s role, refresh token for the affected user session (`getIdToken(true)` or sign-out/in).

- __Replace static data on admin pages__
  - Query Firestore for Users/Subscriptions/Promo Codes/Moderation (reads allowed via `isAdmin()`).
  - Use HTTP endpoints for privileged writes.

- __Audit log viewer (optional)__
  - Build an admin-only page to list `admin_audit_logs` with filters by action/actor/date.

- __Rules hardening (optional)__
  - Consider limiting `promoCodes/*` reads to admins only if you don’t want codes discoverable by clients.

- __Monitoring & alerts__
  - Add log-based metrics/alerts for admin endpoints and permission-denied spikes.

- __Deployment__
  - Deploy Firestore rules: `firestore.rules`
  - Deploy functions: `functions/`
  - Verify in Emulator first if desired.

## Endpoint usage examples

- Base URL (prod): `https://us-central1<PROJECT_ID>.cloudfunctions.net/<FUNCTION_NAME>`

- Example (set admin role):
```bash
curl -X POST \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetUid":"<UID>","makeAdmin":true}' \
  https://us-central1<PROJECT_ID>.cloudfunctions.net/adminSetAdminRole
```

- Example (create promo code):
```bash
curl -X POST \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"LAUNCH30","type":"promo","compDays":30,"maxUses":100,"validFrom":"2025-09-01T00:00:00Z"}' \
  https://us-central1<PROJECT_ID>.cloudfunctions.net/adminCreatePromoCode
```

## Test checklist

- __Admin auth__
  - Non-admin calls return 403 permission-denied.
  - Admin calls succeed and write audit logs.

- __Role change__
  - Promote user to admin → Firestore mirror updated, custom claim set, audit created.
  - Demote user → Firestore mirror updated, claim removed, audit created.
  - A normal admin cannot change roles once super-admin restriction is applied.

- __Promo codes__
  - Create promo code (promo/gift) → Code appears in `promoCodes` with correct fields.
  - Disable promo code → `isActive: false` and audit entry recorded.

- __Rules__
  - Admin can read/list `users/*` and admin collections.
  - Non-admin users cannot read admin collections.

## Rollback plan

- Revert `functions/functions/http/admin.js` export lines in `functions/index.js` if needed.
- Revert `firestore.rules` changes and redeploy.
- Claims are reversible per-user via `setCustomUserClaims`.
