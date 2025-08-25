# Promos, Gifting, and Webhooks – Backend Plan (Stripe + RevenueCat)

This plan defines the backend contracts, Firestore mirrors, and webhook handlers to support:
- Annual Gift Card (unique, one-time, $59.99)
- One-Month Trial Promo (non-unique, distributed via marketing)
- Web (Stripe) and App (RevenueCat/IAP) paths
- Firebase as a mirror only (no pricing logic)

---

## Sources of Truth
- Stripe: products/prices, discounts, promotion codes, and hosted checkout (web)
- RevenueCat: in-app entitlements, intro offers, and promotional entitlements (app)
- Firestore: mirror for routing/UX/analytics (updated by webhooks)

---

## Environment Variables (Cloud Functions)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- RC_SECRET_API_KEY
- RC_WEBHOOK_SECRET (if enabled)
- PROJECT_ID (Firebase)

Optional IDs to store in config (e.g., Firestore/remote config):
- Stripe price IDs (monthly, annual), promotion_code IDs, coupon IDs
- RevenueCat product identifiers and entitlement name (e.g., `pro`)

---

## Firestore Mirror Collections

These are written only by backend Functions and webhooks.

- `featureFlags/{userId}`
  - subscription: 'active' | 'trial' | 'cancelled'
  - plan: 'monthly' | 'annual' | null
  - trialEnd?: timestamp
  - freeThrough?: timestamp (for gift card period)
  - updatedAt: timestamp

- `referrals/{autoId}` (optional, if campaign codes are used)
  - referrerId?: string
  - referredUserId: string
  - code: string
  - redeemedAt: timestamp
  - createdAt: timestamp

- `giftCards/{code}` (unique)
  - type: 'annual_free_year'
  - status: 'issued' | 'redeemed'
  - purchaserUserId?: string
  - redeemedUserId?: string
  - valueMonths: number (12)
  - createdAt: timestamp
  - redeemedAt?: timestamp

- `promoRedemptions/{autoId}` (non-unique campaign codes)
  - userId: string
  - code: string
  - type: 'trial_30d' | 'discount'
  - source: 'web' | 'app'
  - redeemedAt: timestamp

- `webhookEvents/{eventId}` (idempotency)
  - provider: 'stripe' | 'revenuecat'
  - receivedAt: timestamp
  - processedAt?: timestamp
  - status: 'processed' | 'skipped'
  - rawId: string (provider event id)
  - hash?: string (optional signature of payload)

Security: Firestore rules restrict writes to Functions; clients read only their own docs.

---

## HTTP Endpoints (Callable/HTTPS)

1) POST `/createCheckoutSession`
- Input: `{ userId, plan: 'monthly'|'annual', campaignCode?: string }`
- Behavior (web):
  - Validate `userId` from auth context.
  - If `campaignCode` present, resolve to Stripe promotion_code ID.
  - Create Stripe Checkout Session with selected price and optional promotion_code.
  - Return `url` for redirect to Stripe Hosted Checkout.

- Auth: Firebase Auth required; `userId` must match `context.auth.uid`.
- Request example:
  ```json
  { "userId": "uid_123", "plan": "annual", "campaignCode": "TRY30" }
  ```
- Response example:
  ```json
  { "url": "https://checkout.stripe.com/c/session_abc" }
  ```
- Stripe metadata to set on Session/Subscription: `userId`, `plan`, `campaignCode`.
- Success/Cancel URLs: deep link back to app/web (see `docs/DEEP_LINKS_AND_APP_LINKS.md`).

2) POST `/validatePromo`
- Input: `{ code }`
- Behavior:
  - Validate code format/sanity (marketing/campaign logic, not price logic).
  - Return a short-lived validation token and meta `{ type: 'trial_30d'|'discount', sourceHint: 'web'|'app' }`.
  - Note: actual discount/trial is enforced by Stripe/RevenueCat.

- Response example:
  ```json
  { "ok": true, "token": "vp_abcdef", "type": "trial_30d", "sourceHint": "web" }
  ```
- Errors: 400 invalid/expired, 429 rate limited.

3) POST `/issueGiftCard` (admin only)
- Input: `{ purchaserUserId }`
- Behavior:
  - Generates a unique `giftCards.code` and writes `status='issued'`.
  - Normally created by Stripe webhook on purchase; this endpoint is for admin/testing.

- Response example:
  ```json
  { "code": "GFT-9XK2-ABCD", "type": "annual_free_year" }
  ```

4) POST `/redeemGiftCode`
- Input: `{ userId, code }`
- Behavior:
  - Validate `giftCards/{code}` exists and `status='issued'`.
  - Mark `status='redeemed'`, set `redeemedUserId=userId`, `redeemedAt`.
  - Apply benefit per platform:
    - Web path: if using Stripe subscription, create a subscription with a 100% off for 12 months coupon OR simply reflect in Firestore if not creating a Stripe sub yet.
    - App path: grant RevenueCat promotional entitlement for 365 days.
  - Update `featureFlags` accordingly (active, plan=annual, freeThrough).

- Auth: Firebase Auth required.
- Idempotency: if `giftCards.status==='redeemed'`, return 409 with `redeemedUserId`.
- Response example:
  ```json
  { "ok": true, "plan": "annual", "freeThrough": 1735689600000 }
  ```

---

## Paywall Mode & Onboarding

- **Initial state (after sign up)**
  - Backend ensures a `featureFlags/{userId}` doc exists with defaults:
    - `subscription=null`, `plan=null`, optional `trialEnd=null`.
  - Client uses this doc to decide whether to show `Pricing` or route to main app.

- **Web (Stripe) path**
  - Client calls `/createCheckoutSession` with `plan` (and optional campaign code) and redirects to Stripe Hosted Checkout.
  - Success/cancel URLs are configured to return to the app/web.
  - Stripe webhook updates `featureFlags` to `subscription='active'`, sets `plan`, and `trialEnd` if applicable.
  - Client listens (Firestore listener or refetch) and exits paywall on change.

- **App (RevenueCat) path**
  - Client fetches RC offerings and purchases via RC SDK.
  - RevenueCat webhook updates `featureFlags` similarly.
  - Client observes customer info locally for UI, but routing is driven by `featureFlags` to keep parity with web.

- **Viewer bypass**
  - If user is flagged as viewer elsewhere (family sharing), client bypasses paywall regardless of entitlements.

- **Edge cases**
  - If webhook latency occurs, client can show a post-checkout "Verifying purchase" screen and poll/watch `featureFlags`.
  - On cancellation/expiration events, backend updates `featureFlags.subscription='cancelled'` → client returns to paywall on next app open.

---

## Webhook Handlers

### Stripe Webhook: `/webhooks/stripe`
- Listen to:
  - `checkout.session.completed`: first purchase success
  - `invoice.payment_succeeded`: renewals
  - `customer.subscription.updated` / `customer.subscription.deleted`: status changes
  - For gift card product purchases (one-time): identify product ID → issue `giftCards` record and email code
- Actions:
  - On subscription activation: set `featureFlags.subscription='active'`, `plan`, `trialEnd` if present
  - On cancellation/expiration: set `subscription='cancelled'`
  - On gift card one-time purchase: create unique `giftCards/{code}` with `status='issued'`
- Security: verify `STRIPE_WEBHOOK_SECRET`

- Idempotency:
  - Use event `id` to upsert `webhookEvents/{id}`. If exists as processed, skip.
  - Wrap Firestore writes in transactions.
- Mapping notes:
  - Determine plan from `price.id` or `items.data[0].price.lookup_key` → 'monthly'|'annual'.
  - Read `userId` from Stripe `metadata` or from a customer mapping table if needed.

### RevenueCat Webhook: `/webhooks/revenuecat`
- Listen to: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNCANCELLATION`, `EXPIRATION`
- Actions:
  - Map event to `featureFlags` status and plan (via product id → 'monthly'|'annual')
  - If a temporary promotional entitlement was granted, ensure consistency on subsequent purchase
- Security: verify RC webhook signature if enabled

- Idempotency:
  - Use RC `event_id` if provided (or hash of payload) to upsert `webhookEvents/{event_id}`.
- Mapping notes:
  - Use `app_user_id` → `userId`.
  - Determine plan from `product_id` mapping to monthly/annual.
  - For expirations, set `subscription='cancelled'` and optionally `trialEnd`/`freeThrough`.

---

## RevenueCat Promotional Entitlements (Server)
- Use `RC_SECRET_API_KEY` to call RevenueCat REST and grant entitlement `pro` for a period
- Use for:
  - Annual gift card redemption (365 days)
  - One-month promo (30 days) when not using store intro offers

---

## Functions Layout (Proposed)

`functions/functions/`
- `stripeCreateCheckoutSession.js` – implements `/createCheckoutSession`
- `validatePromo.js` – implements `/validatePromo`
- `redeemGiftCode.js` – implements `/redeemGiftCode`
- `webhookStripe.js` – handles `/webhooks/stripe`
- `webhookRevenueCat.js` – handles `/webhooks/revenuecat`
- `rcGrantEntitlement.js` – helper to call RC REST
- `utils/stripe.js` – shared Stripe helpers
- `utils/firestore.js` – Firestore writes with validation
- `utils/logger.js` – structured logs

Note: Files can be TypeScript if repo is configured; keep parity with existing Functions in `functions/functions/`.

---

## Minimal Payload Contracts

- Stripe `checkout.session.completed`
  - `data.object.customer`, `subscription`, `metadata.userId`, `total_details`
- Stripe `invoice.payment_succeeded`
  - `data.object.customer`, `subscription`, `lines`, `discounts`
- RevenueCat purchase events
  - `event`, `app_user_id` (maps to `auth.uid`), `product_id`, `entitlements.active`, `expiration_at`

---

## Testing Matrix
- Web: apply promotion code → Checkout Session completes → Stripe webhook updates Firestore
- App: purchase via RC offering → RC webhook updates Firestore
- Gift card: buy one-time product → Stripe webhook issues code → redeem via `/redeemGiftCode` → Firestore updated
- Expiration/cancellation reflect within app within acceptable delay

---

## Security
- All writes to mirrors happen in Functions only
- Verify webhook signatures (Stripe/RC)
- Validate `userId` from auth context for HTTPS endpoints
- Rate-limit promo validation and redemption endpoints
- Validate `userId` ownership on all endpoints; never trust client-sent `userId` without auth context.
- Store secrets in Functions config; do not ship in client.

---

## Rollout Steps
1) Configure Stripe products/prices, coupons/promotion codes; RevenueCat entitlement/offerings
2) Deploy Functions: endpoints + webhooks
3) Add env vars to Functions
4) Integrate PricingScreen (web redirect to Stripe), RC SDK in app
5) QA end-to-end flows (web/app/gift cards)
6) Set up webhook retry observability and dead-letter logging for failed events
