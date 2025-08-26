import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebaseConfig';

let subscribed = false;
let configured = false;
let unsubscribeAuth: (() => void) | null = null;

export function setupRevenueCat() {
  if (subscribed) return;
  subscribed = true;

  const iosKey = Constants.expoConfig?.extra?.revenuecat?.iosPublicSdkKey as string | undefined;
  const androidKey = Constants.expoConfig?.extra?.revenuecat?.androidPublicSdkKey as string | undefined;
  const apiKey = Platform.select({ ios: iosKey, android: androidKey });

  if (!apiKey) {
    // Keys not set yet; skip configuring Purchases but still attach auth listener
    // so that when keys are provided in a future build, logIn/logOut is handled.
    console.log('[RevenueCat] Public SDK key not set; skipping configure.');
  }

  unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    try {
      if (apiKey && !configured) {
        await Purchases.configure({ apiKey });
        configured = true;
        console.log('[RevenueCat] Configured SDK');
      }

      if (!configured) return; // do nothing until configured

      if (user) {
        await Purchases.logIn(user.uid);
        console.log('[RevenueCat] logIn ->', user.uid);
      } else {
        await Purchases.logOut();
        console.log('[RevenueCat] logOut');
      }
    } catch (e) {
      console.warn('[RevenueCat] setup error', e);
    }
  });
}

export function teardownRevenueCat() {
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  subscribed = false;
  configured = false;
}
