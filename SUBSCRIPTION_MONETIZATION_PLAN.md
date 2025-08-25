# Subscription & Monetization – Implementation Plan

## Summary
Support subscriptions via mobile web (Stripe or platform pay) and optional in-app purchase flow. Plans: $5.99 monthly, $48.00 annual. Promo codes and gift cards via promo codes.

## Data Model (Collections)
- aiCredits
  - userId, credits: number, updatedAt
- featureFlags
  - userId, flags: Record<string, boolean|string|number>, updatedAt
// Optional mirror records (webhook-driven)
- giftCards (mirror)
  - code, type: 'annual_free_year', status: 'issued'|'redeemed', purchaserUserId?, redeemedUserId?, valueMonths?, createdAt, redeemedAt?
- promoRedemptions (mirror)
  - userId, code, type: 'trial_30d'|'discount', source: 'web'|'app', redeemedAt

## Firestore Rules (High-Level)
- aiCredits
  - read: owner
  - write: server/functions only
- featureFlags
  - read: owner
  - write: server/functions only

## Indexes
- aiCredits: [userId]
- featureFlags: [userId]

## Services API (TypeScript)
- src/features/subscription/services/subscriptionService.ts
  - getSubscriptionStatus(userId): Promise<{ plan: 'monthly'|'annual'|null; status: 'trial'|'active'|'cancelled'|null; trialEnd?: Date }>
  - updateCredits(userId, delta): Promise<number>
  - getFeatureFlags(userId): Promise<Record<string, any>>

## Payment Integration Notes
- Mobile web checkout: Stripe Payment Element or platform pay (Apple/Google Pay) via Stripe
- In-app purchases: use RevenueCat or native IAP per platform
- Promo codes and gift cards: redeem to create code-based adjustments/trials

## Sources of Truth
- Stripe and RevenueCat manage promo codes, discounts, trials, and entitlements.
- Firebase/Firestore mirrors state via webhooks for routing/UX/analytics only (no pricing logic in client or Firebase).

## Prerequisites & Credentials

- **Stripe**
  - Account with Products/Prices (monthly, annual) and one-time product (Annual Gift Card $59.99)
  - Coupons + Promotion Codes (e.g., 30-day trial, 100% off 12 months)
  - API Keys: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
  - Webhook Secret: `STRIPE_WEBHOOK_SECRET`
  - IDs to record: price IDs, promotion_code IDs, coupon IDs

- **RevenueCat**
  - Project with Entitlement `pro`, Offerings (monthly/annual)
  - API Keys: Public SDK key(s) per platform; Secret API Key for server
  - Webhook auth/secret (if enabled)
  - Product identifiers mapped to stores

- **Apple App Store Connect**
  - Bundle ID, Paid Apps agreement, Banking/Tax set up
  - In-App Purchase products for monthly/annual; Offer Codes (optional)

- **Google Play Console**
  - Package name, Merchant account
  - In-app products for monthly/annual; Promo codes (optional/limited)

- **Firebase**
  - Project ID, Functions enabled, Service Account for server-to-server calls
  - Firestore rules deployment; Hosting for deep link files if needed

- **Environment (Functions)**
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `RC_SECRET_API_KEY`, `RC_WEBHOOK_SECRET`
  - `PROJECT_ID` and other Firebase config

## UI Entry Points
- Paywall screens during onboarding
- Settings → Subscription: manage plan, apply promo code, view credits

## TODOs
- [ ] Implement subscription service methods
- [ ] Integrate checkout/paywall flows
- [ ] Add rules and indexes
- [ ] Add webhook/Functions handlers for successful purchases to update aiCredits/featureFlags

---

## Frontend Plan

- **Routes/Files**
  - `src/features/auth/screens/PricingScreen.tsx` → plan selection, promo code UI
  - `src/features/auth/screens/CheckoutScreen.tsx` → payment form or redirect to hosted checkout
  - `src/app/(auth)/pricing.tsx`, `src/app/(auth)/checkout.tsx` (route wrappers)
  - `src/features/subscription/components/ManageSubscription.tsx` (settings)

- **Flows**
  - __Onboarding__: after email verification, if not a viewer, show `Pricing` → proceed to `Checkout`
  - __Existing user__: manage subscription in Settings; apply promo; upgrade/downgrade/cancel
  - __Viewer__: bypass screens entirely (as per viewer onboarding docs)

- **Stripe (web checkout)**
  - Option A: Hosted Checkout (link returned from backend)
  - Option B: Payment Element inside app WebView or React Native Stripe
  - Use promo/referral code if applied; show final price and trial indication

- **State**
  - `selectedPlan: 'monthly'|'annual'`
  - `appliedPromo` from referral plan (optional)
  - `subscriptionStatus` fetched via `subscriptionService.getSubscriptionStatus`

---

## Backend Plan

- **Stripe Resources**
  - Products: Monthly, Annual
  - Prices: `$5.99` and `$48.00`
  - Coupons/Promotion Codes: for discount-based promos

- **Endpoints/Functions**
  - `createCheckoutSession(userId, plan, promoCode?)` → returns hosted session URL or client secret
  - Webhooks: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated/deleted`
    - On activation: set `featureFlags.subscription = 'active'`, set `plan`, set `trialEnd` if any
    - On cancellation/expiry: update status accordingly
  - `applyGiftCode(code)` (optional) → converts to credits or trial

- **AI Credits Management**
  - On successful payment, increment `aiCredits` per plan (e.g., monthly allotment)
  - On renewal, top up credits; on cancellation, stop top-ups (credits may persist until used)

- **Security**
  - Validate `userId` authenticity per session creation (Auth context)
  - Trust-only webhook events with signature verification

- **Firestore Rules**
  - Writes to `aiCredits` and `featureFlags` via Functions only

---

## Webhooks Data Flow

1) Client requests checkout → backend creates session with chosen plan (+ optional promo)
2) User pays → Stripe fires webhooks → Cloud Functions update Firestore (`featureFlags`, `aiCredits`)
3) Client listens or refetches subscription status to route accordingly

---

## RevenueCat Integration (Alternative/Complement to Stripe)

- **Why RevenueCat**
  - Unifies Apple App Store and Google Play Billing with one SDK and backend.
  - Handles receipt validation, cross-platform entitlements, and webhooks.

- **Concepts**
  - Entitlements: e.g., `pro` controls premium features.
  - Offerings/Packages: curated plans (monthly/annual) mapped to store products.

- **Client (React Native)**
  - Initialize SDK with API key and identify using `auth.uid`.
  - Fetch offerings → render paywall → purchase a package.
  - Observe customer info to update local `subscriptionStatus` UI.

- **Backend (via Webhooks)**
  - Listen to: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `UNCANCELLATION`, `EXPIRATION`.
  - Update Firestore:
    - `featureFlags.subscription = 'active'|'trial'|'cancelled'`
    - `featureFlags.plan = 'monthly'|'annual'` (map from product id)
    - Top up `aiCredits` on purchase/renewal.
  - Treat RevenueCat as source of truth for IAP; verify webhook signature if enabled.

- **Viewer Bypass Mapping**
  - Viewer detection (shared access) remains independent; viewers skip paywall regardless of entitlements.

- **Promo/Referral Interop**
  - Use App Store Offer Codes / Play promo codes where applicable.
  - Or grant promotional entitlements via RevenueCat REST API for time-limited access.
  - Keep referral records in Firestore; on RevenueCat purchase webhook, mark referral redeemed.

- **Decision Matrix**
  - Mobile-only IAP → prefer RevenueCat.
  - Web checkout needed → use Stripe; optionally also use RevenueCat for IAP. Normalize status into `featureFlags`.

---

## Promo Codes and Gifting Architecture

- **Sources of truth**
  - Web (Stripe): Use Stripe Coupons + Promotion Codes. Stripe computes final price; mirror results to Firestore via webhooks.
  - IAP (RevenueCat/App Store/Play): Use store Offer Codes/Promo Codes or grant promotional entitlements via RevenueCat API; mirror via RC webhooks.

- **Flows**
  - Stripe promo code
    1) Apply code on `Pricing/Checkout` → backend validates against Stripe API
    2) Create Checkout Session with `promotion_code`
    3) Webhooks update Firestore `featureFlags` (status, plan, trialEnd) and `referrals`
  - RevenueCat/IAP promo
    - A) Store-native codes: user redeems → RC reflects entitlement → webhook updates Firestore
    - B) No store code: backend grants temporary RC entitlement after referral validation → webhook updates Firestore

- **Gift cards**
  - Recommended: treat gifts as prepaid credits in Firestore `aiCredits`.
  - Sell "Gift Card" as Stripe one-time products ($10/$25/etc.). On webhook, increment `aiCredits`.
  - Optional gift codes: generate/validate in Firebase; redeem to add credits (no Stripe at redemption time).

- **Trials vs discounts**
  - Stripe: trials via trial settings or trial coupons; discounts via Promotion Codes.
  - IAP: intro offers on store products, or temporary RC entitlements.

- **Setup checklist**
  - Stripe: create Products/Prices, Coupons/Promotion Codes, `createCheckoutSession` endpoint, webhooks to update Firestore
  - RevenueCat: entitlement `pro`, offerings (monthly/annual), webhooks endpoint, client SDK init and purchase flow
  - Firestore: collections `featureFlags`, `aiCredits`, `referrals`; rules to restrict writes to Functions; indexes

### Launch Promotions

- **Annual Gift Card (unique, one-time; price $59.99)**
  - Sell as Stripe one-time product "Annual Gift Card ($59.99)".
  - On purchase webhook:
    - Create unique redemption record in Firestore `giftCards`:
      `{ code, type: 'annual_free_year', status: 'issued', purchaserUserId, valueMonths: 12, createdAt }`.
    - Email code to purchaser/recipient.
  - Redemption (during onboarding or settings):
    - Backend validates `giftCards.code` is unused → marks `redeemed`.
    - Web/Stripe path: create subscription with a 100% off-for-12-months coupon or backfill state in Firestore if not creating a Stripe sub.
    - App/RevenueCat path: grant `pro` entitlement for 365 days via RC REST (promotional entitlement).
    - Update Firestore `featureFlags.subscription='active'`, `plan='annual'`, `trialEnd/+freeThrough` date.

- **One-Month Trial Promo (non-unique; marketing distribution)**
  - Codes are shared (e.g., "TRY30"). No sale as gift card.
  - Web/Stripe: map the campaign code to a Stripe Promotion Code that sets a 30-day trial (or intro coupon), applied at Checkout Session.
  - App/RevenueCat: either use store intro offers on the monthly package or grant 30-day promotional entitlement via RC REST on validation.
  - Firestore: record redemption in `referrals` or `promoRedemptions` `{ userId, code, type:'trial_30d', redeemedAt }` for analytics and to prevent reuse when desired.

---

## QA Checklist

- __Onboarding__
  - Non-viewer: Pricing → Checkout → after success, app routes to main; `featureFlags.subscription` is `active`
  - Viewer: never sees paywall

- __Promotions__
  - Discount promo applies on first invoice; totals match UI
  - Trial promo sets `trialEnd`; app reflects `status: 'trial'` until date

- __Webhooks__
  - On subscription created: flags/credits updated
  - On renewal: credits top-up
  - On cancellation: status changes to `cancelled`

---

## Milestones

1) Define Stripe products/prices; build `createCheckoutSession` + minimal webhooks
2) Frontend Pricing/Checkout screens wired; status fetch and routing
3) Promo/gift integration; credits top-up logic
4) Settings manage subscription surface
