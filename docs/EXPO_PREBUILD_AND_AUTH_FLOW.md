# Expo Prebuild, Run Modes, and Google Auth Redirects (Sproutbook)

This guide clarifies what `npx expo prebuild` does, how it relates to the three common run modes, and which Google OAuth redirect URI is used in each, tailored to your app.

- App owner: `kyle101`
- Slug: `Sproutbook`
- Scheme: `sproutbook` (from `app.json`)
- Bundle/Package: `com.palex.sproutbook`
- Google Client IDs: from `eas.json` env (web, iOS, Android)

---

## What `npx expo prebuild` does

`npx expo prebuild` generates native iOS and Android projects from your Expo config, applying config plugins and syncing `app.json`/`app.config.*` into platform configs.

- Creates/updates `ios/` and `android/` folders.
- Applies plugins like `expo-router`, `expo-web-browser`, `expo-notifications`, `@react-native-google-signin/google-signin`, etc.
- Installs native dependencies and updates platform manifests/Info.plist.
- It does NOT build a store-ready binary by itself. It simply prepares native projects for running locally (`expo run:*`) or for EAS to build.

Common follow-ups after prebuild:
- `expo run:android` or `expo run:ios` (local build using local debug signing)
- or use EAS to build a Dev Client / Preview / Production binary.

---

## The three run modes and redirect URIs

There are three practical ways you’ll run the app, each affecting Google Auth redirect behavior.

1) Expo Go (no native build)
- How: `expo start` then open in Expo Go.
- Redirect: Expo Auth Proxy is used.
  - `https://auth.expo.io/@kyle101/Sproutbook`
- Requirement: Add this URL to your Google OAuth Web Client’s “Authorized redirect URIs” (the client referenced by `EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID`).

2) Prebuilt local app (after `expo prebuild` + `expo run:android|ios`) or EAS Dev Client
- How: You run the native app outside Expo Go (either via `expo run:*` or an EAS Development Client).
- Redirect: App scheme is used (no Expo proxy).
  - Example (conceptual): `sproutbook://auth` (exact path may be `/redirect` under the hood)
- Requirements:
  - iOS: Google OAuth iOS client created with bundle ID `com.palex.sproutbook` and matches `EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID`.
  - Android: Google OAuth Android client created with package `com.palex.sproutbook` and the **SHA‑1** of the keystore used by this build.
    - `expo run:android` uses your local debug keystore (debug SHA‑1).
    - EAS Dev Client uses the EAS keystore SHA‑1 (visible in EAS credentials).

3) EAS Preview/Production builds (TestFlight/Internal testing/Store)
- How: EAS builds and you install via a link/TestFlight/Play.
- Redirect: App scheme (same as above, no proxy).
- Requirements: Same iOS/Android OAuth clients as (2), but ensure SHA‑1 matches the keystore used by EAS for Android.

Tip: If you see `redirect_uri_mismatch` on a device build, it usually means the app is actually running via Expo Go (proxy) or your OAuth clients (bundle/package/SHA‑1) don’t match the build’s identity.

---

## Your current Google Sign-In wiring

File: `src/lib/firebase/auth.ts`
- Uses `expo-auth-session/providers/google` with `useIdTokenAuthRequest` and `WebBrowser.maybeCompleteAuthSession()`.
- Reads client IDs from env (`eas.json`).
- On success: obtains `id_token`, creates a Firebase `GoogleAuthProvider.credential`, then calls `signInOrLinkWithCredential`.
- Ensures the Firestore user doc exists via `ensureUserDocumentExists(uid, name, email)`.

File: `src/services/auth/signInOrLink.ts`
- If current user is anonymous, it **links** the credential to preserve UID.
- Otherwise, it signs in with the credential.
- Also includes `linkIfAnonymousWithEmail()` for email/password.

File: `src/services/userService.ts`
- `ensureUserDocumentExists()` will create `users/{uid}` with defaults (free trial, timestamps) only if email is present (per Firestore rules).
- Also contains profile/child storage helpers and onboarding checks.

File: `src/lib/firebase/firebaseConfig.ts`
- Firebase v9 setup. Uses `getReactNativePersistence(AsyncStorage)` on native and `getAuth(app)` on web.
- Loads config from `EXPO_PUBLIC_*` env vars.

---

## Checklist per mode

- Expo Go:
  - Add `https://auth.expo.io/@kyle101/Sproutbook` to Web Client’s redirect URIs.

- Prebuilt (`expo run:*`) or EAS Dev Client:
  - iOS client: bundle `com.palex.sproutbook` matches `EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID`.
  - Android client: package `com.palex.sproutbook` with **debug SHA‑1** (for `expo run:android`) or EAS keystore SHA‑1 (for Dev Client).

- EAS Preview/Production:
  - Same as above but ensure the EAS keystore SHA‑1 is used for Android.

Environment variables are defined in `eas.json` per profile (development/preview/production).

---

## Common pitfalls

- Using Expo Go but forgetting to add the Expo proxy URL to the Web Client.
- Android SHA‑1 mismatch between local debug builds and EAS builds.
- Mixing up client IDs (Web vs iOS vs Android). Each platform needs its own correct OAuth client.
- Trying to force `useProxy: false` while still running in Expo Go (not supported).

---

## Quick verification

- Log the redirect being used to confirm the mode:
  ```ts
  import * as AuthSession from 'expo-auth-session';
  console.log('Redirect URI:', AuthSession.makeRedirectUri());
  ```
  - In Expo Go: you’ll see the `https://auth.expo.io/...` proxy.
  - In prebuilt/EAS: you’ll see a `sproutbook://...` scheme.

---

## TL;DR

- `expo prebuild` prepares native projects; it’s not a store build.
- Expo Go uses the Expo proxy URL; prebuilt/EAS builds use your `sproutbook://` scheme.
- Ensure the correct Google OAuth clients per platform and SHA‑1 for the exact build you’re running.
