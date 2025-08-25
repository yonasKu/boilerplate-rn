# Client Store Setup Checklist (Apple App Store + Google Play)

Audience: Client/owner of the Apple and Google developer accounts. Goal: prepare both stores and RevenueCat so the developer can integrate and test in‑app purchases safely before production.

---

## Quick Client Instructions
Please complete these now. App records can be created and used for testing; no public release is required. Product IDs must match exactly across Apple, Google, and RevenueCat.

1) Apple (App Store Connect)
- Agreements, Tax, and Banking: set to Active.
- Create the app with the final Bundle ID (e.g., `com.yourco.sproutbook`).
- Create a Subscription Group (e.g., Pro) and add products:
  - `sprout_pro_monthly_v1` — USD $5.99
  - `sprout_pro_yearly_v1` — USD $48.00
  - Optional: Non‑Consumable `sprout_pro_lifetime`

2) Google (Play Console)
- Set up a Merchant account (required for paid products).
- Create the app with the final Package Name (e.g., `com.yourco.sproutbook`).
- Create the same products:
  - Subscriptions with base plans: `sprout_pro_monthly_v1` ($5.99), `sprout_pro_yearly_v1` ($48.00)
  - Optional Managed product: `sprout_pro_lifetime`
- Set status to Active (not Draft). Use an Internal testing track for installs.

3) RevenueCat
- Create a project (or use existing). Configure:
  - Entitlement: `pro`
  - Offering: `default`
  - Add products and link to store products: `sprout_pro_monthly_v1`, `sprout_pro_yearly_v1`, optional `sprout_pro_lifetime`
- Share iOS/Android Public SDK keys with the developer.

Note: IDs must be identical in all three places and store products must be Active/Approved.
If you need to change the bundle identifier/package name, follow `docs/CHANGE_BUNDLE_AND_PACKAGE_IDS.md` first.

FAQ — Do I need to create the app before adding products?
- Yes. Both Apple and Google require an app record to create products.
- iOS: You can create IAPs once the app exists. For testing/submission, upload at least one TestFlight build.
- Android: Create the app, then mark products Active and publish an Internal test release. Install via the Play testing link.

## 1) Access & Ownership
- Apple App Store Connect: invite <your developer email> with access to In‑App Purchases and TestFlight.
- Google Play Console: invite <your developer email> with access to Products and Internal testing.
- RevenueCat: create a project and invite <your developer email> as an Admin (or create the items below and share keys).

Info to share with developer:
- iOS Bundle ID (e.g., com.yourco.sproutbook)
- Android Package Name (e.g., com.yourco.sproutbook)
- RevenueCat Public SDK Keys (iOS + Android)
- Entitlement key (e.g., "pro") and Offering ID (e.g., "default")
- Final Product IDs (exact strings) and prices
- Apple Sandbox tester Apple IDs (email + password)
- Google License tester Gmail addresses
- Test links: TestFlight invite link + Play Internal testing link

Reference: `docs/PRODUCT_IDS.md` (source of truth for IDs and pricing)

---

## 2) Apple App Store Connect Setup (iOS)

1. Agreements, Tax, Banking
   - In App Store Connect → Agreements, Tax, and Banking: sign all required agreements, add banking and tax info. Must be Active before selling IAPs.

2. App Record
   - Create the app with the final Bundle ID (e.g., com.yourco.sproutbook). Ensure the app name, category, and age rating are set.

3. Enable In‑App Purchases
   - Nothing to toggle; you enable by creating IAPs under the app → Features → In‑App Purchases.

4. Create Products
   - Subscriptions: create a Subscription Group (e.g., Pro). Add:
     - `sprout_pro_monthly_v1` → set price to USD $5.99 and localizations.
     - `sprout_pro_yearly_v1` → set price to USD $48.00 and localizations.
     - Optional: Intro Offer/Free Trial if desired.
   - One‑time (optional): Non‑Consumable `sprout_pro_lifetime` (if you choose to sell lifetime on iOS).

5. Product State
   - Ensure products are in a valid state (Ready to Submit/Approved). Link to an app build if required.
   - Upload a build via Xcode/EAS so products can be approved and testable through TestFlight.

6. Sandbox Testers
   - App Store Connect → Users and Access → Sandbox Testers: create at least one tester Apple ID.
   - On test device: Settings → App Store → Sandbox Account: sign in with that tester to test purchases.

7. TestFlight
   - Create an internal or external TestFlight build, invite testers, and share the invite link.

Tips:
- Prices and availability must be set; otherwise RevenueCat will show empty offerings.
- Purchases will not work in Expo Go; use TestFlight or a custom dev client build.

---

## 3) Google Play Console Setup (Android)

1. Merchant Account
   - Play Console → set up a merchant account (required for paid products).

2. App Record
   - Create the app with the final Package Name (e.g., com.yourco.sproutbook). Complete basic setup (app content, privacy, etc.).

3. Billing
   - No manual permission needed when using RevenueCat; but the app must be signed and installed from Google Play for purchases to work.

4. Create Products
   - Subscriptions: create base plans for each product ID:
     - `sprout_pro_monthly_v1` → base plan with price USD $5.99 and localized prices.
     - `sprout_pro_yearly_v1` → base plan with price USD $48.00 and localized prices.
     - Add intro/discount offers if desired under each base plan.
   - One‑time (optional): Managed product `sprout_pro_lifetime` if you intend to support lifetime on Android.

5. Activate Products
   - Set status to Active (not Draft). Draft products won’t be returned to the app.

6. License Testers
   - Setup → License testing: add tester Gmail accounts used on test devices.

7. Internal Testing Track
   - Upload an AAB (e.g., EAS Internal/Production build) to an Internal test track and publish that release.
   - Add testers, accept invitations, and install from the Play testing link on the device.

Tips:
- Sideloaded APKs cannot reliably complete purchases; always install from the Play testing link.
- If prices don’t show, clear Play Store cache on device.

---

## 4) RevenueCat Setup

1. Create a RevenueCat Project
   - Option A: Invite the developer as Admin and they’ll set it up.
   - Option B: Client sets up and shares keys + confirms configuration.

2. Configure
   - Entitlement: `pro`
   - Offering: `default`
   - Products: add `sprout_pro_monthly_v1`, `sprout_pro_yearly_v1` (and optional `sprout_pro_lifetime`) and link each to the exact store products you created.
   - Copy Public SDK Keys for iOS and Android and share with the developer.

3. Webhooks (later)
   - Developer will provide a secure webhook URL to mirror entitlements to Firestore. Client may need to add the URL in the RevenueCat dashboard.

---

## 5) What the Developer Will Do (after you complete the above)
- Integrate RevenueCat SDK in the app (configure at start, log in with Firebase UID after sign-in, log out on sign-out).
- Use the existing Pricing screen to show offerings and handle purchase/restore.
- Implement backend webhook to sync entitlements to Firestore.
- Test purchases on iOS Sandbox and Android Internal test.

---

## 6) Common Blockers (and fixes)
- Empty offerings: product IDs not identical, store products not Active/Approved, prices missing, or using Expo Go.
- Can’t purchase: device not using Sandbox tester (iOS) or app not installed from Play testing link (Android). No merchant account.
- Price not visible on Android: Play Store cache; clear and retry. Ensure tester account is added as License tester.

---

## 7) Final Deliverables to Developer
- Bundle ID + Package Name
- RevenueCat Public SDK keys (iOS/Android)
- Product IDs + final prices (confirm match `docs/PRODUCT_IDS.md`)
- Entitlement key (`pro`) + Offering ID (`default`)
- Sandbox Apple IDs + License tester Gmails
- TestFlight and Play Internal testing links
- App Store Connect and Play Console access with sufficient permissions

---

Once these are complete, we can proceed to implement and verify in‑app purchases without a public production release.
