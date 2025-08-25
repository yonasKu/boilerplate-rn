# Mobile Frontend Subscriptions Integration Checklist (RevenueCat + Promos/Gift Cards)

This checklist guides the React Native (Expo) mobile integration for:
- RevenueCat in-app subscriptions (iOS/Android)
- Gift card redemption and promo code validation
- Paywall routing using Firestore `featureFlags` mirror

Keep RevenueCat as the source of truth; Firestore mirrors state for routing/UX.

---

## Prerequisites
- [ ] App configured with Firebase Auth + Firestore SDK
- [ ] Backend Functions deployed per `docs/PROMOS_AND_WEBHOOKS_BACKEND_PLAN.md` and `docs/REVENUECAT_BACKEND_PLAN.md`
  - `/promo/validate` (optional), `/promo/redeem` or `/giftcards/redeem`
  - `/webhooks/revenuecat`
- [ ] RevenueCat project with products/entitlements configured
- [ ] App links/deep links configured if needed for navigation continuity

---

## Packages (RN/Expo)
- [ ] `@react-native-firebase/app`, `@react-native-firebase/auth`, `@react-native-firebase/firestore`
- [ ] `react-native-purchases` (RevenueCat Purchases SDK)
- [ ] `expo-linking` (if using deep links within mobile flows)
- [ ] `zod` (optional) to validate server payloads

---

## Config/Constants
- [ ] RevenueCat API keys (public SDK keys) per platform
- [ ] Product identifiers → plan mapping (monthly/annual)
- [ ] Campaign code display strings (marketing)

Create a `src/constants/subscriptions.ts`:
- [ ] `RC_API_KEYS = { ios, android }`
- [ ] `PRODUCTS = { monthly: 'prod_monthly', annual: 'prod_annual' }`

---

## Firestore Mirror Listener
- [ ] Ensure document `featureFlags/{userId}` is created on signup
- [ ] Add listener on login to watch:
  - `subscription: 'active' | 'trial' | 'cancelled' | null`
  - `plan: 'monthly' | 'annual' | null`
  - `trialEnd?: Timestamp`
  - `freeThrough?: Timestamp`
- [ ] Route user:
  - If `subscription==='active'` → main app
  - Else → paywall/pricing
- [ ] Handle cancellation/expiration by returning user to paywall on next app open

Suggested module: `src/services/featureFlags.ts`

---

## Paywall/Pricing UI
- [ ] Implement a `PricingScreen` with:
  - Plan toggle (Monthly/Annual)
  - Promo code input (complimentary access; no checkout)
  - Button: "Subscribe In-App" (RevenueCat)
  - Gift card entry CTA (navigates to Gift Card screen)
- [ ] If viewer (family sharing), bypass paywall (see `docs/FAMILY_SHARING_FRONTEND_PLAN.md`)

Suggested paths (Expo Router):
- `src/app/(auth)/pricing.tsx` (or `src/app/(main)/pricing.tsx` depending on your structure)
- `src/components/ui/Paywall.tsx` for reusable sections

---

## RevenueCat (In-App) Flow
- [ ] Initialize Purchases on app start:
  - `Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId })`
- [ ] Fetch offerings and display current packages
- [ ] Purchase:
  - `const { customerInfo } = await Purchases.purchasePackage(pkg)`
- [ ] Post-purchase UI:
  - Show "Verifying purchase" while webhook updates Firestore
  - Listen for `featureFlags.subscription` → navigate to main app
- [ ] Restore purchases on login or reinstall
- [ ] Map `productIdentifier → plan` to display and analytics

Files to create:
- `src/services/revenuecat.ts`
- `src/hooks/useOfferings.ts`

---

## Promo Codes (Mobile Frontend)
- [ ] Input field with basic format validation (no business logic)
- [ ] Redeem complimentary access: call `POST /promo/redeem` with Firebase ID token
  - Backend grants RC Promotional Entitlement (no store checkout)
- [ ] Optionally call `POST /promo/validate` to show a preview message before redeeming
- [ ] On success, refresh entitlements or rely on Firestore mirror for routing
- [ ] Record minimal analytics client-side; all authoritative writes happen on backend

---

## Gift Cards (Mobile Frontend)
- [ ] Gift Card screen with code entry
- [ ] Call `POST /giftcards/redeem` with Firebase ID token and `{ code }`
- [ ] Handle responses:
  - 200: show success and navigate; `featureFlags` should flip to active
  - 409: already redeemed → show error with `redeemedUserId`
  - 400/404: invalid code
- [ ] If on app path, no purchase UI is needed; entitlement granted by backend via RC

Files:
- `src/app/(main)/gift-card.tsx`
- `src/services/giftCards.ts`

---

## Routing Logic
- [ ] On app start and auth state change:
  - Attach `featureFlags` listener
  - If `active` → go to main tabs; else → pricing
- [ ] Show blocking screen while state loads or post-purchase verification is pending
- [ ] Respect viewer bypass flag (family sharing)

---

## Error/Edge Handling
- [ ] Webhook delays: keep spinner with timeout + retry button
- [ ] Network failures: retry with backoff for all server calls
- [ ] Duplicate taps: disable purchase/checkout buttons while in-flight
- [ ] Idempotent UI state: prevent multiple redemptions/back-to-back purchases

---

## Telemetry
- [ ] Log screen views: Paywall, CheckoutRedirect, GiftCard
- [ ] Log CTA clicks: InAppPurchase, RedeemGift
- [ ] Log results: PurchaseSuccess, PurchaseFailed, GiftRedeemed, GiftInvalid

---

## QA Scenarios
- [ ] New user → paywall → RC monthly purchase → active → relaunch persists
- [ ] New user → paywall → RC annual purchase → cancel via RC test → back to paywall
- [ ] Gift card redemption → active annual with `freeThrough`
- [ ] Promo code validation error handling and rate limit UI
- [ ] Offline mode during verification → resumes
- [ ] Viewer user bypasses paywall

---

## Frontend Work Items (Create/Update)
- [ ] `src/constants/subscriptions.ts`
- [ ] `src/services/featureFlags.ts`
- [ ] `src/services/revenuecat.ts`
- [ ] `src/services/giftCards.ts`
- [ ] `src/hooks/useOfferings.ts`
- [ ] `src/app/(auth)/pricing.tsx`
- [ ] `src/app/(main)/gift-card.tsx`
- [ ] Deep link handler in app root (if used)

---

## Notes
- Do not write to Firestore mirrors from the client.
- Always read `featureFlags` to drive routing; RC customer info can be used for UI hints but mirrors are authoritative for navigation consistency.
- Keep product IDs in one constants file.
