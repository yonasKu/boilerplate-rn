# RevenueCat + App Store + Play Store: Setup Requirements (No Code)

This document covers everything you must prepare and configure before implementing the paywall.
It explains the stable appUserID strategy, product IDs, and the required steps in RevenueCat, App Store Connect, and Google Play Console.

Use this as a pre-implementation checklist.

---

## Identity Strategy: Stable appUserID

- Why: RevenueCat tracks entitlements by `appUserID`. If it changes (anonymous IDs, device IDs, random UUIDs), prior purchases won’t be recognized, and restores will fail.
- Requirement: Use the Firebase `uid` as the `appUserID` for all platforms (iOS + Android). This ensures:
  - Cross-device and cross-platform recognition of purchases.
  - Consistent restore behavior (`restorePurchases`) after reinstall.
- When to set:
  - After Firebase authentication succeeds (user is logged in), initialize/log in to RevenueCat with `appUserID = firebaseAuth.currentUser.uid`.
- On logout:
  - Call the SDK logout (so the next user doesn’t inherit entitlements).
- Account deletion:
  - If a user deletes their account, do not reuse their UID for another person; let Firebase generate a new UID if they re-register.
- Multiple platforms:
  - Use the same UID for iOS and Android for the same user; RevenueCat can sync entitlements across platforms if products map to the same entitlement.

---

## Product IDs: Naming and Consistency

- One source of truth: Define all product IDs first, then create them identically in:
  - App Store Connect (In‑App Purchases / Subscriptions)
  - Google Play Console (In‑app products / Subscriptions)
  - RevenueCat Products
- Naming conventions (examples):
  - Subscriptions: `sprout_pro_monthly_v1`, `sprout_pro_yearly_v1`
  - Lifetime: `sprout_pro_lifetime`
- Rules of thumb:
  - Lowercase, snake_case (no spaces, no uppercase). Keep it consistent.
  - Don’t include platform names in the ID (avoid `_ios`, `_android`). Use the same ID across stores when possible.
  - Once live, never rename product IDs.
- Subscriptions specifics:
  - App Store: subscriptions live inside a Subscription Group (create one group per family of plans; free trials set here).
  - Play Store: use Subscriptions with base plans and offers (trial/intro price configured here). Managed in-app products are for one-time purchases.

---

## RevenueCat Project Setup

- Create a Project (one per environment recommended: Dev/Staging/Prod) or use one project with separate offerings.
- Get Public SDK Keys for iOS and Android.
- Create Products (mirror store products by product ID).
- Create Entitlements (e.g., `pro`).
- Map Products → Entitlements (every product that grants premium should grant the `pro` entitlement).
- Create an Offering (e.g., `default`).
  - Add Packages, e.g., `monthly` → `sprout_pro_monthly_v1`, `annual` → `sprout_pro_yearly_v1`.
- Optional: Create additional offerings for experiments.

Checklist in RevenueCat:
- Products exist with matching IDs to stores.
- Entitlements created and mapped.
- Offering `default` created with Packages referencing the products.
- Public SDK keys noted (keep Secret keys off the client).

---

## App Store Connect Setup (iOS)

1) Agreements, Tax, Banking: All active.
2) App created with the correct Bundle ID (e.g., `com.palex.sproutbook`).
3) In‑App Purchases / Subscriptions enabled.
4) Create products:
   - For subscriptions: create a Subscription Group, then add `sprout_pro_monthly_v1`, `sprout_pro_yearly_v1` with pricing, localization, and (optionally) intro offer/trial.
   - For one-time purchase: create a Non‑Consumable product (e.g., `sprout_pro_lifetime`).
5) Ensure products are in a valid state (Ready to Submit/Approved). Attach to at least one app version/build if needed.
6) Create Sandbox Testers (Users and Access → Sandbox). Use these accounts on-device for testing.

Tips:
- Prices and availability must be set; missing pricing causes empty offerings via RevenueCat.
- If you can’t purchase, ensure you’re using a build that supports StoreKit (TestFlight or a custom dev client). Expo Go won’t work.

---

## Google Play Console Setup (Android)

1) Merchant account set up.
2) App created with the correct Package Name (e.g., `com.yourco.sproutbook`).
3) Billing: No manual permission needed with RevenueCat; but app must be signed and installed from Play for purchases.
4) Create products:
   - Subscriptions with base plans (`sprout_pro_monthly_v1`, `sprout_pro_yearly_v1`) and any offers (trial/intro pricing) under each base plan.
   - One-time purchase: Managed in-app product (`sprout_pro_lifetime`).
5) Activate products (status must be Active, not Draft).
6) License testers: Setup → License Testing → add tester Gmail.
7) Internal testing track:
   - Upload an AAB build (EAS production or internal). Publish the track.
   - Enroll testers and install via the Play testing link.

Tips:
- Sideloaded APKs often cannot complete purchases; use the Play testing link.
- Clear Play Store cache if pricing doesn’t show on device.

---

## Environment & Keys Strategy

- Use the Public SDK keys from RevenueCat for iOS and Android. Do NOT ship Secret keys in the app.
- Store the keys in `app.json` → `expo.extra.revenueCat` or your existing env management.
- Consider separate RC projects and keys for Dev vs Prod to avoid pollution.
- Configure the app to pick keys by `releaseChannel`/environment.

---

## Complimentary Access (Promo Codes & Gift Cards) – Prerequisites

- Scope
  - We are NOT using iOS Offer Codes or Android Play promo codes at this time. Those store-managed flows are out of scope.
  - We WILL use backend-managed complimentary access: promo codes and gift cards that grant temporary entitlement via RevenueCat Promotional Entitlements.
- Backend responsibilities
  - Expose `POST /giftcards/redeem` (and/or `/promo/redeem`) that requires Firebase ID token.
  - Validate code, ensure not consumed/expired, enforce idempotency.
  - Call RevenueCat REST to grant a Promotional Entitlement for the user (`appUserID = Firebase UID`) for a defined duration (e.g., 30/90 days).
  - Record audit log and redemption state in Firestore.
- Client responsibilities
  - Provide a code input in `src/app/(auth)/pricing.tsx` or a dedicated screen `src/app/(main)/gift-card.tsx`.
  - On success, refresh `Purchases.getCustomerInfo()` or rely on Firestore mirror (`users/{uid}/subscription`) for routing/UX.
- Security & keys
  - Keep RevenueCat Secret API keys on the server only (Functions config). Never ship secret keys in the app.
  - Required backend envs: `RC_SECRET_API_KEY`, webhook secret (for RC → Functions), and any signing secrets for your endpoints.
- Testing inventory
  - Create test promo/gift codes that grant 1–3 months. Validate entitlement activation and expiration via RC webhooks and Firestore mirror.

---

## Testing Matrix (Before Launch)

- iOS Sandbox
  - Install TestFlight or a custom dev client built with EAS.
  - Sign in to the device’s Sandbox Account.
  - Fetch offerings → see valid prices.
  - Purchase monthly → entitlement `pro` becomes active.
  - Restore on second device → entitlement restores.

- Android Internal Testing
  - Use tester account as the device’s primary Google account.
  - Install from the Play testing link (internal track).
  - Fetch offerings → see valid prices.
  - Purchase monthly → entitlement `pro` becomes active.
  - Restore on second device → entitlement restores.

- Cross-Platform
  - Purchase on iOS; login on Android with same Firebase UID; entitlement should appear.

---

## What to Collect and Where to Put It

- App identifiers
  - iOS Bundle ID and Android Package Name → `app.json` and store consoles
- RevenueCat Public SDK keys → `app.json` (`expo.extra.revenueCat`)
- Product IDs list (single source of truth) → keep in `docs/PRODUCT_IDS.md` or in this doc
- Entitlement key (e.g., `pro`) → `docs` and RevenueCat setup
- Offering ID (e.g., `default`) → `docs` and RevenueCat setup

---

## Common Failure Modes (Quick Reference)

- Offerings empty
  - No Offering/Packages in RC, products not linked, or store products not active/approved.
  - Using Expo Go (no billing frameworks). Use custom dev client or store build.

- Purchase fails
  - iOS: Not using sandbox account or TestFlight/custom client.
  - Android: Not installed from internal testing link; tester not added; products inactive.

- Entitlement not active after purchase
  - Product not mapped to Entitlement in RC; appUserID not stable (not Firebase UID).
  - Try `restorePurchases()`; confirm transaction visible in RC → Customers.

---

## Pre-Implementation Acceptance Checklist

- __Identity__
  - Stable appUserID strategy documented (Firebase UID).
  - Login/Logout flows plan to log in/out of RevenueCat.

- __Products__
  - Product ID list finalized and identical in App Store, Play, and RevenueCat.
  - Entitlement key (e.g., `pro`) defined; Products ↔ Entitlement mapped.
  - Offering `default` created with monthly and yearly packages.

- __Stores__
  - App Store agreements, banking, tax active; products configured.
  - Play Console merchant account active; products Active; internal testing track ready; license testers set.

- __Environment__
  - Public SDK keys saved in config; plan for dev vs prod keys.

- __Testing__
  - iOS sandbox testers created; Android license testers added.
  - Plan to verify offerings, purchase, restore on both platforms.

---

## Notes

- This document is setup-only (no code). Implementation guidance is in `docs/REVENUECAT_INTEGRATION.md`.
- Do not hardcode RevenueCat Secret API keys in the client app.
- Keep product IDs stable forever once launched.
