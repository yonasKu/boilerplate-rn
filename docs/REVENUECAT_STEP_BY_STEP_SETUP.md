# RevenueCat — Step‑by‑Step Setup (Sproutbook)

This guide walks you through configuring RevenueCat end‑to‑end and integrating it with the app and backend.
It complements `docs/REVENUECAT_INTEGRATION.md` and `docs/REVENUECAT_BACKEND_PLAN.md` and assumes store products
already exist per `docs/PRODUCT_IDS.md`.

- Source of truth for product IDs: `docs/PRODUCT_IDS.md`
- Entitlement: `pro`
- Offering: `default`
- Products:
  - Monthly subscription — `sprout_pro_monthly_v1` — $5.99 USD
  - Annual subscription — `sprout_pro_yearly_v1` — $48.00 USD

---

## Prerequisites

- App Store Connect: Subscriptions created and (for testing) attached to a build; Group: `Sprout Pro`.
- Google Play Console: Subscriptions with Active base plans; Internal testing track available.
- Payments/Merchant setup complete on both stores.
- Firebase Auth in the app; we will use the Firebase UID as RevenueCat `appUserID`.

### Important: RevenueCat Paywalls are optional and NOT used here
- Ignore the Paywalls tab in RevenueCat; we render our own paywall UI in-app.
- Use these areas only: Products, Entitlements, Offerings, Webhooks, and Project Settings (API Keys).

---

## UI terminology map (new sidebar labels)

- Product catalog → contains Products, Entitlements, Offerings
- Apps & providers → where you add iOS/Android app configs and see Public SDK keys per app
- API keys → project‑level keys (also visible after adding app configs)
- Integrations → includes Webhooks
- Project settings → project name, transfer behavior, etc.

---

## 1) Create/Configure RevenueCat Project

1. Log in → top bar: Projects → New Project → name it (e.g., Sproutbook Prod).
2. Left nav: Apps & providers → + Add app config → add both:
   - iOS app: Bundle ID (e.g., `com.palex.sproutbook`)
   - Android app: Package name (e.g., `com.palex.sproutbook`)
   This generates Public SDK keys per platform.
   - iOS: Open the iOS app config → In‑app purchase key configuration → upload the `.p8` and enter its Key ID.
     - Where to get: App Store Connect → Users and Access → Keys → In‑App Purchase → “+” → Generate → download `.p8` (only once) and copy the Key ID. Issuer ID is on the same Keys page (only needed if prompted).
   - Android: Open the Android app config → connect Google Play service account JSON.
     - Where to get: Play Console → API access → Link project (if needed) → Service accounts → Create new → Grant access (at least subscriptions/orders read) → Create key → download JSON → upload here.
3. Left nav: API keys → confirm Public SDK keys exist for iOS/Android.
   - Keep the Secret API key server‑side only. Do NOT embed it in the client.
4. Optional but recommended: Project settings → Transferring purchases → set to "Transfer to new App User ID" to support restore when users sign in across devices.
5. (Optional) Create a separate project for Dev/Staging, or keep one project and use different offerings.

References: `docs/REVENUECAT_INTEGRATION.md`

---

## 2) Create Products in RevenueCat and Link Stores

1. Left nav: Product catalog → Products → + New product.
   - Identifier: `sprout_pro_monthly_v1` → Create.
   - Repeat for `sprout_pro_yearly_v1`.
2. Open each product → Link store product → choose store:
   - App Store: select the exact subscription product with matching ID.
   - Google Play: select the exact subscription with active base plan and matching ID.
3. Verify: After linking and once store products are Active, the price will appear in RevenueCat.

Notes:
- Product IDs must be identical across App Store, Play Console, and RevenueCat.
- If price does not show, ensure the store product/base plan is Active and available in at least one country.

---

## 3) Create Entitlement and Offering

1. Left nav: Product catalog → Entitlements → + New entitlement → Key: `pro` → Create.
2. Left nav: Product catalog → Offerings → + New offering → Identifier: `default` → Create (or open existing `default`).
3. Inside the `default` offering → Add Package:
   - Package identifier: `monthly` (you can use the preset if available) → Select product: `sprout_pro_monthly_v1` → Save.
   - Add another package `annual` → Select product: `sprout_pro_yearly_v1` → Save.

Checklist:
- Products exist and are linked to stores.
- Entitlement `pro` exists.
- Offering `default` has `monthly` and `annual` packages pointing to the products above.

---

## 4) Client Integration (High‑Level)

Use the RevenueCat SDK for your platform (React Native/Native). Configure per environment with the correct Public SDK keys.

Key points:
- Identify the user with the Firebase UID as `appUserID` to keep entitlements consistent across devices/platforms.
- Fetch offerings and display available packages to the user.
- When the user purchases, RevenueCat will manage receipts and entitlement status.

Minimal flow (pseudo):

1. Configure SDK with platform Public SDK key.
2. After Firebase sign‑in, set `appUserID = firebaseUser.uid`.
3. Fetch offerings → read `default` → get `monthly` and `annual` packages.
4. Initiate purchase for the selected package.
5. Check entitlement `pro` to unlock premium features.

References: `docs/REVENUECAT_INTEGRATION.md`

---

## 5) Backend/Webhooks (Server‑Side)

Set up a secure webhook endpoint to receive RevenueCat events and update Firestore.

Steps:
1. Left nav: Integrations → Webhooks → + Add webhook → paste your HTTPS endpoint URL → Save.
2. Add an Authorization header: `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`; the server validates this token. Do not use signature headers.
3. Handle events (e.g., INITIAL_PURCHASE, RENEWAL, EXPIRATION, CANCELLATION) idempotently.
4. Upsert `users/{uid}/subscription` using the Firebase UID (the `appUserID` you pass to RevenueCat).

Recommended Firestore schema (see full detail in `docs/REVENUECAT_BACKEND_PLAN.md`):
- `users/{uid}/subscription`
  - `status`: 'active' | 'trialing' | 'grace_period' | 'billing_issue' | 'expired' | 'revoked'
  - `entitlement`: 'pro'
  - `productId`: e.g., `sprout_pro_monthly_v1`
  - `platform`: 'ios' | 'android' | 'unknown'
  - `periodType`: 'trial' | 'intro' | 'normal' | null
  - `expiresAt`: Timestamp | null
  - `latestPurchaseAt`: Timestamp | null
  - `autoRenewStatus`: boolean | null
  - `rcEnvironment`: 'PRODUCTION' | 'SANDBOX' | 'UNKNOWN'
  - `lastEventId`: string
  - `updatedAt`: server timestamp

Important:
- Use `lastEventId` to guarantee idempotency.
- Never trust client‑provided entitlement info for unlocking features; rely on webhook/Firestore state.

---

## 6) Testing Checklist

Apple (Sandbox/TestFlight):
- Subscriptions created and added to a build on the Version page.
- Sandbox testers created and used on device.
- Install via TestFlight; Expo Go is not sufficient.

Android (Internal testing):
- Subscriptions exist with Active base plans.
- Internal testing track live; tester Gmail enrolled.
- Install via opt‑in link (not sideloaded APK).

RevenueCat:
- Offerings API returns `default` with `monthly` and `annual` packages.
- Purchasing works and `pro` entitlement becomes active.
- Dashboard shows events for the test user.

---

## Troubleshooting

- Empty offerings in app:
  - Store products not Active, not linked in RC, or Offering packages not mapped correctly.
- Product ID mismatch:
  - Verify IDs are identical across App Store, Play, and RC (use `_v1` versioned IDs).
- Android purchase flow missing:
  - Install from Internal testing track; ensure tester Gmail is enrolled and Play Store uses that account.
- Apple purchase not available:
  - Attach subscriptions to the app version; use TestFlight build; sign in with Sandbox tester.
- Entitlement not unlocking across devices:
  - Ensure you identify users with stable `appUserID` (Firebase UID) and avoid anonymous installations.
- Backend not reflecting status:
  - Verify Authorization Bearer token, event handling, and Firestore write rules; check `lastEventId` usage.

---

## Copy‑Paste (Offering mapping)

```
Entitlement: pro
Offering: default
Packages:
  monthly -> sprout_pro_monthly_v1
  annual  -> sprout_pro_yearly_v1
```

---

## References

- Product IDs and pricing: `docs/PRODUCT_IDS.md`
- Client integration details: `docs/REVENUECAT_INTEGRATION.md`
- Backend/webhook plan: `docs/REVENUECAT_BACKEND_PLAN.md`
- App Store setup: `docs/APP_STORE_CONNECT_SUBSCRIPTIONS_SETUP.md`
- Google Play setup: `docs/GOOGLE_PLAY_SUBSCRIPTIONS_SETUP.md`
