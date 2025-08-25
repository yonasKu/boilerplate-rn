# RevenueCat Paywall Integration (Expo React Native)

This guide sets up a mobile paywall using RevenueCat for subscriptions and one-off purchases in SproutBook.

Use this as the single source of truth to implement and ship the paywall.

---

## Prerequisites

- RevenueCat account and a Project
- iOS bundle identifier (e.g., com.yourco.sproutbook) and Android package name (e.g., com.yourco.sproutbook)
- App Store Connect app created with In‑App Purchases enabled
- Google Play Console app created with In‑App Products enabled
- Products created in both stores with matching product identifiers (e.g., sprout_pro_monthly_v1, sprout_pro_yearly_v1)
- RevenueCat configuration:
  - Entitlement key (e.g., `pro`)
  - Offering identifier (e.g., `default`)
  - Public SDK keys (one for iOS, one for Android)
- Expo EAS project (Managed workflow) or Bare workflow

Notes:
- With Expo Managed, RevenueCat requires a custom dev client (for local testing) and EAS build for production.
- Keep product IDs identical across stores and RevenueCat.

---

## Install SDK

1) Add the RevenueCat React Native SDK

```bash
npm install react-native-purchases
```

2) (Expo Managed) Add config plugin in `app.json`/`app.config.ts`

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "ios": {
            "useStoreKit2IfAvailable": true
          }
        }
      ]
    ]
  }
}
```

3) (Expo Managed) Create a custom dev client for local testing

```bash
npx expo install expo-dev-client
npx expo run:ios   # or: npx expo run:android
# or build once with EAS for device testing
# eas build -p ios --profile development
# eas build -p android --profile development
```

4) Add your RevenueCat Public SDK keys to config

Option A (recommended): put them in `app.json` extra

```json
{
  "expo": {
    "extra": {
      "revenueCat": {
        "iosPublicSdkKey": "RC_IOS_PUBLIC_SDK_KEY",
        "androidPublicSdkKey": "RC_ANDROID_PUBLIC_SDK_KEY",
        "entitlement": "pro"
      }
    }
  }
}
```

Option B: use your existing env management if you have one.

---

## Recommended Project Structure (optional)

If you want a dedicated feature area, consider:
- `src/features/subscription/services/revenueCatService.ts` – wrapper around RevenueCat SDK (init, offerings, purchase, restore)
- `src/features/subscription/hooks/useSubscription.ts` – loads offerings, exposes purchase/restore helpers
- Use your existing Pricing screen as the paywall UI (see below)

---

## Wire-up Steps

1) Initialize after login (recommended)

Initialize RevenueCat with a stable appUserID = Firebase UID after the user signs in. Example (pseudo):

```ts
// e.g., in your auth effect after sign-in
// Use your wrapper or call the SDK directly. The key is: appUserID = Firebase UID.
// import Purchases from 'react-native-purchases'
// or: import { revenueCatService } from "src/features/subscription/services/revenueCatService";

useEffect(() => {
  if (user?.uid) {
    // Example using a service wrapper
    // revenueCatService.init(user.uid);

    // Or direct SDK usage (typical v6 pattern):
    // Configure once (e.g., at app start)
    // Purchases.configure({ apiKey: PLATFORM_PUBLIC_SDK_KEY });
    // Then identify the user after login
    // await Purchases.logIn(user.uid);
  }
}, [user?.uid]);

// On logout (important to avoid entitlement leakage):
// await Purchases.logOut();
```

2) Use your existing Pricing screen as the Paywall

- You already have a Pricing screen in the signup flow. Use it to:
  - Load offerings from RevenueCat
  - List packages (monthly, yearly) with localized price
  - Trigger purchase and handle success/restore

Example (pseudo, SDK-level):

```ts
// On mount
const offerings = await Purchases.getOfferings();
const packages = offerings.current?.availablePackages ?? [];

// On select
const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
const isActive = !!customerInfo.entitlements.active["pro"]; // your entitlement key
if (isActive) {
  // proceed to next step in your flow (e.g., success → login or main app)
}

// Restore (e.g., from a button)
const restored = await Purchases.restorePurchases();
```

3) Load offerings and purchase

In your existing Pricing screen, either:
- Use a `useSubscription()` hook you create to wrap SDK calls, or
- Call the RevenueCat SDK directly (see example above).

After SDK install and initialization, the Pricing screen should list packages from your `default` offering and allow purchase/restore.

4) Gate premium features

Check for an active entitlement before showing premium-only UI. If no entitlement, route users to your Pricing screen:

```ts
// Option A: using your own hook
// import { useSubscription } from "src/features/subscription/hooks/useSubscription";
// const { hasEntitlement } = useSubscription();
// if (!hasEntitlement("pro")) {
//   router.push("<YOUR_PRICING_SCREEN_ROUTE>");
//   return null;
// }

// Option B: direct SDK check (conceptual)
// const info = await Purchases.getCustomerInfo();
// const hasPro = !!info.entitlements.active["pro"];
// if (!hasPro) router.push("<YOUR_PRICING_SCREEN_ROUTE>");
```

5) Restore purchases

The Paywall screen exposes a Restore button via the hook. You can also add it in Settings.

## Promo Codes and Gift Cards (Client UX)

- Complimentary Promo Code (no checkout)
  - Goal: grant temporary access without charging at checkout.
  - Where: Paywall text field on `src/app/(auth)/pricing.tsx` or a dedicated screen.
  - Flow:
    1. User enters code.
    2. Call backend `POST /giftcards/redeem` or `/promo/redeem` with Firebase ID token.
    3. Backend validates code and grants RevenueCat Promotional Entitlement to the user (appUserID = Firebase UID).
    4. Refresh `Purchases.getCustomerInfo()` or rely on Firestore mirror `users/{uid}/subscription` to update UI/routing.
  - Notes: No store checkout; no discounted store price is shown.

- Gift Cards (complimentary access)
  - Screen: `src/app/(main)/gift-card.tsx` with a simple form (code input).
  - Call backend: `POST /giftcards/redeem` with Firebase ID token.
  - Backend grants a RevenueCat Promotional Entitlement for the user’s Firebase UID for the configured duration (e.g., 1–3 months).
  - On success, refresh `CustomerInfo` and/or listen to Firestore `users/{uid}/subscription` to reflect entitlement and route accordingly.

---

## Store-side Checklist

- App Store Connect
  - Banking, tax, and agreements are active
  - In‑App Purchases created and in the correct state (Ready to Submit / Approved)
  - Sandbox testers created for QA

- Google Play Console
  - Merchant account set up
  - In‑App Products created (Active or in review)
  - License testers added for QA

- RevenueCat
  - Products linked to Store products
  - Entitlements created (e.g., `pro`)
  - Offering created (e.g., `default`) with packages (monthly, yearly)
  - Public SDK keys copied into app config

---

## Production Build

- Expo Managed: Build with EAS for each platform

```bash
eas build -p ios --profile production
eas build -p android --profile production
```

- Submit to stores and complete review. RevenueCat will reflect purchases once live testers or reviewers can access store products.

---

## Troubleshooting

### Offerings empty

If `getOfferings()` returns empty:

- __RevenueCat dashboard checks__
  1. Products: RevenueCat → Products → each product shows a linked Store product (App Store/Play) and a price.
  2. Entitlements: RevenueCat → Entitlements → your entitlement (e.g., `pro`) exists.
  3. Offerings: RevenueCat → Offerings → an Offering (e.g., `default`) exists with at least one Package (e.g., `monthly`, `annual`). Packages must reference linked products.
  4. Product IDs are identical across App Store, Play, and RevenueCat (e.g., `sprout_pro_monthly_v1`).
  5. Store products are in a valid state (App Store: Approved or ready for test with a submitted build; Play: Active).

- __App checks__
  - Use the correct Public SDK key for the platform (iOS vs Android).
  - Initialize the SDK before calling `getOfferings()`.
  - Use a build that includes the billing frameworks: Expo Go cannot fetch/purchase IAPs. Use a custom dev client or a store build.
  - If you recently changed products/offerings, fully restart the app and try again (store caches can be sticky).

### Purchases fail

Common causes and fixes:

- __iOS (StoreKit)__
  1. Build: Use a custom dev client or TestFlight. Purchases do not work in Expo Go.
  2. Sandbox account: Device → Settings → App Store → Sandbox Account: sign in with a Sandbox Apple ID (not your real Apple ID).
  3. App capabilities: In‑App Purchases capability must be enabled (the `react-native-purchases` Expo plugin handles this on EAS builds).
  4. Products: App Store Connect → In‑App Purchases: products are configured with pricing and cleared for sale. Ensure at least one app version exists and IAPs are attached.
  5. On device: Sign out of the App Store (if necessary), reboot, then attempt purchase again. Check Xcode/console logs for StoreKit errors.

- __Android (Google Play Billing)__
  1. Install from Play: Upload an AAB to an Internal Testing track and install from the Play testing link. Sideloaded APKs/dev-client builds often cannot complete purchases.
  2. License testers: Play Console → Setup → License testing: add the tester Gmail used on the device.
  3. Products: In‑app products are Active. Prices set. Package name matches exactly.
  4. Device account: Primary Google account on device is a licensed tester and enrolled in the internal test.
  5. Clear Play Store cache if products don’t show price or purchases fail (Settings → Apps → Google Play Store → Storage → Clear cache).

- __General__
  - Expo Go is not supported for IAP. Use a custom dev client or store build.
  - Ensure network time is correct on device; extreme clock drift can affect receipts.
  - Check logs for specific error codes from RevenueCat (e.g., Billing unavailable, User cancelled).

### Entitlement not active after purchase

You completed a purchase but `CustomerInfo` shows no active entitlement:

- __RevenueCat mapping__
  1. RevenueCat → Products: each product is mapped to an Entitlement.
  2. RevenueCat → Entitlements: confirm your entitlement key (e.g., `pro`).
  3. RevenueCat → Customers: search by appUserID. Verify the latest transaction appears and the entitlement shows as Active.

- __App user identity__
  - Use a stable appUserID (recommend Firebase `uid`). Log this during init. Anonymous IDs can change across reinstalls and won’t match prior purchases.
  - After login, ensure you configure/log in the SDK with the same stable user ID. After logout, call the SDK logout if applicable.
  - Try a restore: call `restorePurchases()` to resync receipts → RevenueCat → entitlements.

- __Store status__
  - iOS: if products are not Approved/cleared for sale, entitlements may not activate.
  - Android: product must be Active, and the app must be installed from a Play testing track by a tester account.

### Android testing requirements (internal track)

To test real purchases on Android:

1. Create an Internal testing release in Play Console and upload an AAB built with EAS.
2. Add testers to the track and also to License testing.
3. Publish the testing release, accept the invite, and install from the Play testing link.
4. Ensure in‑app products are Active and prices set.
5. Use the tester Google account as the device’s primary account. If products don’t show, clear Play Store cache and retry.

---

## Next Steps

- Replace placeholders in `revenueCatService.ts` with real SDK calls once `react-native-purchases` is installed
- Hook the paywall into your existing upgrade paths (e.g., Pricing → Paywall → Purchase)
- Track purchase events (optional) via Firebase Analytics or RevenueCat webhooks
