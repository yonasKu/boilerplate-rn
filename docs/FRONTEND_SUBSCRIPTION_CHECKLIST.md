# Frontend Subscription Integration Checklist

This checklist describes how to integrate RevenueCat on the client (Expo) and gate features using the subscription snapshot written by the backend webhook (`users/{uid}.subscription`).

## Prerequisites
- Backend webhook deployed and writing `users/{uid}.subscription` (status, expirationDate, etc.).
- Firestore rules: client cannot write `users/{uid}.subscription`.
- Firebase SDK initialized in `src/lib/firebase/firebaseConfig.ts`.

## 1) Install RevenueCat SDK (Expo)
Use the React Native SDK with Expo:

- Package: `react-native-purchases`
- Docs: https://www.revenuecat.com/docs/react-native#expo

Commands (Expo-managed):
- `npx expo install react-native-purchases`
- or `npm install react-native-purchases`

Configure the config plugin:
- In `app.json` (or `app.config.ts`) add:
```
{
  "expo": {
    "plugins": [
      "react-native-purchases"
    ]
  }
}
```
Note: You need a custom dev client for native modules. Use `expo run:ios` / `expo run:android` (or EAS build) after installing.

## 2) Add SDK Keys
RevenueCat Public SDK Keys (not secrets):
- iOS: RevenueCat Dashboard → API Keys → Public SDK Key
- Android: RevenueCat Dashboard → API Keys → Public SDK Key

Set via Expo config (suggested):
- app.json → `extra.revenuecat`:
```
{
  "expo": {
    "extra": {
      "revenuecat": {
        "iosPublicSdkKey": "RC_IOS_PUBLIC_SDK_KEY",
        "androidPublicSdkKey": "RC_ANDROID_PUBLIC_SDK_KEY"
      }
    }
  }
}
```
Or read from env if preferred.

## 3) Initialize RevenueCat and Identify User
At app start (e.g., root provider), after Firebase Auth is ready:

```ts
import Purchases from 'react-native-purchases';
import { onAuthStateChanged } from 'firebase/auth';
import Constants from 'expo-constants';
import { auth } from '@/lib/firebase/firebaseConfig';
import { Platform } from 'react-native';

const iosKey = Constants.expoConfig?.extra?.revenuecat?.iosPublicSdkKey;
const androidKey = Constants.expoConfig?.extra?.revenuecat?.androidPublicSdkKey;

export function setupRevenueCat() {
  onAuthStateChanged(auth, async (user) => {
    const apiKey = Platform.select({ ios: iosKey, android: androidKey });
    if (!apiKey) return;

    await Purchases.configure({ apiKey });

    if (user) {
      await Purchases.logIn(user.uid); // tie purchases to Firebase UID
    } else {
      await Purchases.logOut();
    }
  });
}
```

## 4) Fetch Offerings and Show Paywall
```ts
const offerings = await Purchases.getOfferings();
const current = offerings.current;
// current?.availablePackages => display to user
```

Purchase:
```ts
const { customerInfo } = await Purchases.purchasePackage(pkg);
// RevenueCat will sync; webhook updates Firestore; UI will reflect via useSubscription()
```

Restore:
```ts
const { customerInfo } = await Purchases.restorePurchases();
```

## 5) Gate Features from Firestore Snapshot
We recommend read-only gating from Firestore (backend source of truth).

- Use hook `src/hooks/useSubscription.ts`:
  - Returns `{ status, isActive, snapshot, loading, error }` derived from `users/{uid}.subscription`.
  - `isActive` is true for `active` or `trial`.

UI example:
```tsx
const { isActive, loading } = useSubscription();
if (loading) return <Spinner/>;
return isActive ? <PremiumFeature/> : <Paywall/>;
```

## 6) Feature Flags (optional)
- Use `SubscriptionService.getFeatureFlags` to gate experimental or non-subscription features if needed.
- AI credits functionality has been removed from the frontend service; do not implement or reference it.
- Do not write to `users/{uid}.subscription` client-side.

## 7) Test Flow
- Create a test user in sandbox and perform purchase in app.
- Verify webhook writes to `users/{uid}.subscription` and `revenuecatEvents` audit.
- Confirm app reflects `isActive` via hook.
- Test restore purchases.

## 8) Deploy
- Build with EAS or `expo build` as per your workflow.
- Ensure `react-native-purchases` is included and public SDK keys are configured in app config.

## 9) Pricing Screen and Paywall (Examples)

- __Create a pricing screen__: e.g., `src/app/(auth)/pricing.tsx` (matches current route setup)

```tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Text, View } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export default function PricingScreen() {
  const [loading, setLoading] = useState(true);
  const [pkgs, setPkgs] = useState<PurchasesPackage[]>([]);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        setPkgs(current?.availablePackages ?? []);
      } catch (e: any) {
        setError(e?.message || 'Billing is not configured yet');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const buy = async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      // Webhook will update Firestore; UI updates via useSubscription()
    } catch (e: any) {
      // user cancelled or error; optionally surface e.userCancelled
    }
  };

  const restore = async () => {
    try { await Purchases.restorePurchases(); } catch {}
  };

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>{error}</Text>;

  return (
    <View style={{ gap: 12 }}>
      {pkgs.map((p) => (
        <Button
          key={p.identifier}
          title={`${p.product.title} — ${p.product.priceString}`}
          onPress={() => buy(p)}
        />
      ))}
      <Button title="Restore purchases" onPress={restore} />
    </View>
  );
}
```

- __Gate premium areas__ with the hook and route to pricing when needed:

```tsx
import { useSubscription } from '@/hooks/useSubscription';
import { router } from 'expo-router';

export function PremiumGate({ children }: { children: React.ReactNode }) {
  const { isActive, loading } = useSubscription();
  if (loading) return null;
  if (!isActive) {
    router.push('/(auth)/pricing');
    return null;
  }
  return <>{children}</>;
}
```

- __Use the gate__ around premium components:

```tsx
<PremiumGate>
  <PremiumFeature />
</PremiumGate>
```

- __Add an "Upgrade" button__ anywhere to navigate:

```tsx
import { router } from 'expo-router';
<Button title="Upgrade" onPress={() => router.push('/(auth)/pricing')} />
```

## 10) When SDK keys arrive (Production-ready steps)

Once you have your RevenueCat Public SDK Keys, complete these steps to enable the native Purchases SDK in the app.

- __Add keys to Expo config__: `app.json`

```json
{
  "expo": {
    "plugins": [
      "react-native-purchases"
    ],
    "extra": {
      "revenuecat": {
        "iosPublicSdkKey": "RC_PUBLIC_IOS_KEY",
        "androidPublicSdkKey": "RC_PUBLIC_ANDROID_KEY"
      }
    }
  }
}
```

- __Rebuild a custom dev client__ (required for native modules like `react-native-purchases`).
  - Android (Windows):

```bash
npx expo run:android
npx expo start --dev-client
```

  - iOS: requires macOS + Xcode. On Windows, skip iOS. On macOS you can:

```bash
npx expo run:ios
# or using EAS
eas build --platform ios
```

### What is an Expo Dev Client?
- __Expo Go__ (from the store) cannot load arbitrary native modules. `react-native-purchases` is a native module, so you need a __custom dev client__ that bundles your native modules.
- An __Expo Dev Client__ is your app, built for development, including your chosen native modules and plugins. You then use `expo start --dev-client` to debug it with Metro just like Expo Go.

### Where does Expo Prebuild fit?
- `expo run:android`/`expo run:ios` triggers __Expo Prebuild__, which generates the `android/` and `ios/` native projects from your `app.json` config (e.g., the `react-native-purchases` plugin). This step ensures the native module is linked.
- After prebuild, the platform build runs (Gradle/Xcode). The resulting app is your dev client.
- For CI or distribution, you can use __EAS Build__, which also respects your config and plugins.

### After the build
- Launch the dev client and run `npx expo start --dev-client`.
- `setupRevenueCat()` already reads the keys from `app.json` and logs in/out with Firebase Auth. No extra code changes needed.
- Purchasing and restore flows on the pricing screen will start working once products and offerings are configured in RevenueCat and the store.
