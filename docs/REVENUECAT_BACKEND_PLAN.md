# RevenueCat Backend Integration Plan (Firebase Functions + Firestore)

Purpose: Keep subscription state authoritative in Firestore via RevenueCat webhooks. This is documentation only (no code changes).

---

## Objectives
- Mirror RevenueCat entitlement status into Firestore per user (keyed by Firebase UID).
- Handle purchases, renewals, trials, cancellations, billing issues, and expirations.
- Make processing idempotent and secure. Support Dev vs Prod separation.

---

## Identity Alignment (critical)
- Client must set RevenueCat `appUserID = Firebase UID` after login.
- Why: RevenueCat webhooks include the same `appUserID`, allowing the backend to update `users/{uid}` reliably.
- Logout should also log out from RevenueCat on the client to prevent entitlement leakage across accounts.

---

## Client Responsibilities and Touchpoints

- Configure SDK at app start
  - Purchases.configure({ apiKey: PLATFORM_PUBLIC_SDK_KEY })
- Identify the user after Firebase login
  - await Purchases.logIn(user.uid) // Firebase UID
- On logout
  - await Purchases.logOut()
- Existing Pricing screen (signup flow)
  - Fetch offerings (Purchases.getOfferings), list packages (monthly/yearly)
  - Purchase (Purchases.purchasePackage) and check entitlement (e.g., "pro")
  - Restore purchases when user taps Restore (Purchases.restorePurchases)
- Gate premium features
  - Check active entitlement via Purchases.getCustomerInfo() or mirror from Firestore
  - If not active, navigate to the existing Pricing screen
- Environment keys
  - Use the correct public SDK key per platform/environment (Dev/Prod)

---

## Firestore Data Model
Document: `users/{uid}/subscription`

Fields (recommendation):
- `status`: 'active' | 'trialing' | 'grace_period' | 'billing_issue' | 'expired' | 'revoked'
- `entitlement`: string (e.g., `pro`)
- `productId`: string (e.g., `sprout_pro_monthly_v1`)
- `platform`: 'ios' | 'android' | 'unknown'
- `periodType`: 'trial' | 'intro' | 'normal' | null
- `expiresAt`: Timestamp | null
- `latestPurchaseAt`: Timestamp | null
- `autoRenewStatus`: boolean | null
- `rcEnvironment`: 'PRODUCTION' | 'SANDBOX' | 'UNKNOWN'
- `lastEventId`: string (for idempotency)
- `updatedAt`: server timestamp

Optional:
- `users/{uid}/subscriptionEvents/{eventId}` with raw payload for audit.

---

## Webhook Endpoint (Firebase HTTPS Function)
- Create an HTTPS function, e.g., `revenuecatWebhook`.
- Configure RevenueCat → Webhooks to POST to:
  - `https://<region>-<project-id>.cloudfunctions.net/revenuecatWebhook`
- Security:
  - Require Authorization header: `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
  - In the function, verify the Bearer token against env var `REVENUECAT_WEBHOOK_SECRET`. Reject if invalid.
  - Only accept `application/json` and limit body size.

Environment variables (Firebase Functions config):
- `REVENUECAT_WEBHOOK_SECRET` = shared secret/token used in the Authorization header for webhook validation.
- `APP_ENV` = 'dev' | 'prod' (for routing/guardrails).
- (Optional) `ALLOWED_ENVIRONMENTS` if you want to ignore sandbox in prod, etc.

---

## Idempotency Strategy
- RevenueCat webhooks include enough data to build a unique event key (e.g., event id if provided, or a hash of [app_user_id, product_id, purchase_date, event_type]).
- Store this as `lastEventId` and/or keep a small `subscriptionEvents` collection.
- If an incoming event id/key was already processed, return 200 OK and skip writes.

---

## Promo Codes and Gift Cards (HTTP Endpoints)

- POST `/promo/validate`
  - Auth: optional (allow pre-login for UI hints). If logged in, accept Firebase ID token.
  - Body: `{ code: string }`
  - Response example: `{ valid: boolean, label?: string, effect?: 'trial' | 'percent_off' | 'free_month', expiresAt?: string }`
  - Notes: Validation only; does not grant entitlements. Client uses result to adjust paywall messaging.

- POST `/giftcards/redeem`
  - Auth: required (Firebase ID token). Uses `uid` as RevenueCat `appUserID`.
  - Body: `{ code: string }`
  - Logic:
    - Validate code (exists, not consumed, within validity window, eligible for this user).
    - Idempotency: derive key from `(uid, code)`; if already redeemed, return existing grant.
    - Grant complimentary access via RevenueCat Promotional Entitlements (REST API) to entitlement (e.g., `pro`) for a fixed duration (e.g., 30/90 days).
    - Persist audit trail: `users/{uid}/promoRedemptions/{redemptionId}` with `{ code, duration, grantedAt, until }`.
    - Optionally pre-write `users/{uid}/subscription` for immediate UX; webhook will reconcile as source of truth.
  - Response example: `{ ok: true, entitlement: 'pro', until: string }`

### RevenueCat Promotional Entitlements (server-side)
- Keep RC Secret API key in Functions config; never on client.
- Call RC REST to create a promotional entitlement for `appUserID = uid` mapped to your entitlement (e.g., `pro`) with an expiration.
- Webhook will reflect activation/expiration into Firestore `users/{uid}/subscription`.

### Security & Abuse Prevention
- Require valid Firebase ID token for redemption; verify against Firestore user.
- Rate-limit endpoints and throttle repeated failures.
- Sign/validate incoming requests if you expose external redemption (e.g., from web landing pages).
- Store idempotency keys and redemption state to prevent double-spend.

---

## Event Handling Logic (high level)
Map incoming events to status updates. Common categories:
- Purchase/Trial Start/Intro: set `status` to 'active' or 'trialing', set `expiresAt`, `productId`, `periodType`, `autoRenewStatus`.
- Renewal: `status` remains 'active', bump `expiresAt`, update `latestPurchaseAt`.
- Billing Issue / Grace Period: set `status` to 'billing_issue' or 'grace_period' when indicated.
- Cancellation / Non‑renewing: set `autoRenewStatus` to false; keep `status` active until `expiresAt` is past.
- Expiration: set `status` to 'expired', clear entitlement usage on the client side accordingly.
- Product Change (upgrade/downgrade): update `productId`, `periodType`, and entitlement remains granted if active.

Notes:
- Always trust RevenueCat as the source of truth for entitlement activation.
- Preserve `rcEnvironment` (e.g., 'SANDBOX' vs 'PRODUCTION') from payload if present. Alternatively, use separate RC projects/webhooks for Dev vs Prod.

---

## Multi‑Environment Options
- Option A: Separate RC projects for Dev and Prod, each with its own webhook URL and keys.
- Option B: Single RC project; use `rcEnvironment` in the payload to branch logic.
- Recommendation: Use separate projects or separate webhook endpoints to avoid mixing test data with production.

---

## Testing Plan (end‑to‑end)
1) Prepare test users
   - iOS: Create Sandbox testers in App Store Connect; sign in on device (Settings → App Store → Sandbox Account).
   - Android: Add license testers in Play Console; publish an Internal testing track and install via the Play testing link.
2) Client: ensure `appUserID = Firebase UID` after login.
3) Make a purchase on iOS (sandbox) and Android (internal test).
4) Verify Firestore:
   - `users/{uid}/subscription` reflects `status = active` (or `trialing`), correct `productId`, `expiresAt`, `platform`, `rcEnvironment`.
5) Let the sandbox renewal/expiration cycle run (faster than real time) and confirm updates via subsequent webhooks.
6) Cancel auto‑renewal (where supported) and verify `autoRenewStatus = false` and eventual `expired` status after `expiresAt`.
7) Restore test: uninstall and reinstall app, sign in with same Firebase user, verify entitlement remains active.

---

## Operational Considerations
- Logging: Log event type, appUserID, environment, and decision outcome. Avoid logging full PII or full receipts.
- Monitoring: Track webhook errors and retries in Cloud Functions logs. Consider alerts for repeated failures.
- Backfill: Provide an admin tool or one‑time script to query RevenueCat subscriber info and backfill Firestore for existing users if needed.
- Data privacy: Keep RevenueCat secret keys on the server only. Do not ship secret keys in the client.

---

## Deliverables (when implementing)
- Firebase HTTPS function `revenuecatWebhook` with:
  - Authorization token validation
  - Idempotency guard
  - Event parsing and Firestore updates
- Firestore security rules updated (if needed) to allow the function to write `users/{uid}/subscription` while keeping client writes restricted.
- Documentation on how to rotate `REVENUECAT_WEBHOOK_SECRET`.

---

## Summary
- Use Firebase UID as the single appUserID in RevenueCat to align identities.
- Let RevenueCat drive entitlement state via secure webhooks.
- Store subscription state under `users/{uid}/subscription` and ensure idempotent, environment‑aware processing.
