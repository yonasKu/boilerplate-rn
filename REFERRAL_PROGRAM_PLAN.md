# Referral Program – Implementation Plan

## Summary
Each user gets a unique referral/promo code. Friends use the code on signup/paywall to receive a discount or trial; V1 gives referrer no reward.

## Data Model (Collections)
- promoCodes
  - code, type: 'trial'|'discount', value, recurring?: boolean, maxRedemptions?, expiresAt?, createdBy?
  - createdAt, updatedAt
- referrals
  - referrerId, referredUserId, code, redeemedAt, createdAt

## Firestore Rules (High-Level)
- promoCodes
  - read: public (for code validation)
  - write: server/admin only (creation/updates)
- referrals
  - create: when a code is redeemed by an authenticated user
  - read: user can read their own referral record(s); admin can query

## Indexes
- promoCodes: [code]
- referrals: [referrerId], [referredUserId], [code]

## Services API (TypeScript)
- src/features/referral/services/referralService.ts
  - getPromoCodes(code): Promise<PromoCode | null>
  - createReferral(referrerId, referredUserId, code): Promise<void>
  - getReferrals(referrerId): Promise<Referral[]>
  - completeReferral(referredUserId): Promise<void>

## UI Entry Points
- Paywall / checkout flow: input for promo/referral code
- Settings: show my code, share via SMS/email/copy link

## Monetization Hooks
- If promo type is 'trial', extend trial end date
- If 'discount', apply to first purchase cycle

## TODOs
- [ ] Create services and types
- [ ] Add rules and indexes
- [ ] Integrate promo code entry in paywall
- [ ] Admin tooling (optional) for code generation

---

## Frontend Plan

- **Routes/Files**
  - `src/features/auth/screens/PricingScreen.tsx` and `CheckoutScreen` (promo code input and validation)
  - `src/app/(auth)/pricing.tsx` (wrapper route)
  - `src/features/referral/components/ShareReferral.tsx` (show my code + share sheet)

- **User Flows**
  - __New user at paywall__: enters code → validate → show applied benefit (trial/discount) → proceed to payment → on success, record referral
  - __Existing user in Settings__: view my code (`user.referralCode` or generated) → share deep link `sproutbook://signup?ref=CODE` or HTTPS equivalent

- **UX Rules**
  - Code input debounced validation (on blur or explicit "Apply") via `referralService.getPromoCodes(code)`
  - Show clear state: "Code applied: 7-day trial" or "10% off first month"
  - Edge cases: expired, maxed out, invalid → inline error; allow removing an applied code

- **Local State**
  - `appliedPromo: { code, type, value } | null` stored in checkout state; persisted only through the checkout session

- **Deep Links (optional)**
  - Accept `?ref=CODE` on marketing links and prefill promo input on paywall

---

## Backend Plan

- **Admin/Generation**
  - Code generation tool (script or admin screen) to create `promoCodes` with constraints
  - Optional ownership: `createdBy` for audit

- **Validation API**
  - Cloud Function HTTPS endpoint: `validatePromo(code)`
    - Checks existence, status (expiresAt, maxRedemptions), returns type/value and a short-lived token to prevent tampering

- **Redemption on Purchase**
  - Checkout submits applied code + validation token to backend (Stripe webhook or Functions)
  - On successful purchase or trial start:
    - Create `referrals` record `{ referrerId?, referredUserId, code, redeemedAt }`
    - Increment redemption count on `promoCodes`
    - Apply effects:
      - Trial: set `trialEnd` or subscription status accordingly
      - Discount: create a Stripe coupon/promotion code or adjust amount server-side for first invoice

- **Security**
  - Prevent self-referrals (disallow if `referrerId === referredUserId`)
  - Validate token issued during `validatePromo` to block client-only application

- **Firestore Rules**
  - `promoCodes` writable only by admin/service accounts
  - `referrals` create allowed via Callable/HTTPS function; reads restricted to owner/admin

---

## Types (Draft)

```ts
type PromoType = 'trial' | 'discount';
type PromoCode = {
  code: string;
  type: PromoType;
  value: number; // days for trial, percent for discount
  recurring?: boolean;
  maxRedemptions?: number;
  expiresAt?: number; // timestamp
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
};

type Referral = {
  referrerId?: string;
  referredUserId: string;
  code: string;
  redeemedAt: number;
  createdAt: number;
};
```

---

## RevenueCat Interop

- **Use case**: When using RevenueCat for Apple/Google IAP, discounts/trials can be applied via store-native mechanisms or by granting entitlements.

- **Options**
  - Store promos: App Store Offer Codes / Play promo codes (managed in each store; surfaced via RevenueCat). Use for percentage/amount discounts or free trials that the store supports.
  - Promotional entitlement: Use RevenueCat REST API to grant the `pro` entitlement for a limited time (e.g., 7-day access) after a referral. Suitable when store promo codes are not available or too complex.

- **Flow with referrals**
  1) User enters referral code on paywall → backend `validatePromo(code)` returns benefit.
  2) If purchasing via RevenueCat:
     - For discount promos: show discounted package if available via Offerings (preconfigured with intro offers) or instruct to redeem store offer code.
     - For trial promos: either select a package with intro trial or grant a temporary entitlement via RevenueCat API upon validation.
  3) On purchase webhook from RevenueCat (`INITIAL_PURCHASE`), mark referral as redeemed and (if applicable) stop any temporary entitlement overlap.

- **Data consistency**
  - Firestore remains the system of record for `referrals` and `promoCodes`.
  - Subscription status/entitlements are read from RevenueCat webhooks into Firestore `featureFlags`.

- **Security**
  - Only the backend calls RevenueCat REST to grant promotional entitlements.
  - Validate referral tokens to prevent client-only application.

---

## QA Checklist

- __Valid code__: applies correct benefit and survives navigation to checkout
- __Invalid/expired/maxed__: shows error and blocks apply
- __Self-referral__: blocked
- __Webhook flow__: on payment success, `referrals` entry created; promo usage increments
- __Trial promo__: user status shows trial until expected end
- __Discount promo__: first invoice reflects discount amount

---

## Milestones

1) Backend validation + minimal admin generation (script) + indexes/rules
2) Frontend: code input + validation + apply/remove UX
3) Checkout integration + webhook handling for redemption
4) Settings share-my-code UI (optional if V1 is generic codes)
