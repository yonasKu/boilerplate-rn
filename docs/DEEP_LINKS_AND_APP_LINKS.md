# Deep Links, Universal Links, and Android App Links

This document is the single source of truth for configuring and testing links that open the app directly.

It covers iOS Universal Links (AASA), Android App Links (assetlinks.json), your app config (`app.json`), hosting, QA, and troubleshooting.

---

## Overview

- URL used in docs: `https://app.sproutbook.com/invite/accept?code=INV123`
- App scheme (for testing): `sproutbook://invite/accept?code=INV123`
- Expo Router route to handle both: `src/app/invite/accept.tsx`

Prerequisites:
- You own the domain (e.g., `sproutbook.com`) and control DNS for `app.sproutbook.com`.
- You can host files over HTTPS at `https://app.sproutbook.com/.well-known/` with no redirects.
- You have production app identifiers and signing set up (bundle ID, package name, signing keys).

---

## iOS: Universal Links

1) Add Associated Domains in `app.json`

````json
{
  "expo": {
    "scheme": "sproutbook",
    "ios": {
      "bundleIdentifier": "com.sproutbook.app",
      "associatedDomains": [
        "applinks:app.sproutbook.com"
      ]
    }
  }
}
````

2) Host the AASA file on your domain

- URL: `https://app.sproutbook.com/.well-known/apple-app-site-association`
- Requirements:
  - No file extension
  - Served with `Content-Type: application/json`
  - No redirects (200 OK)

Minimal AASA example (update placeholders):

````json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["<APPLE_TEAM_ID>.com.sproutbook.app"],
        "paths": [
          "/invite/*"
        ]
      }
    ]
  }
}
````

Notes:
- Replace `<APPLE_TEAM_ID>` and the bundle ID with your real values.
- If you plan more routes, add additional paths (e.g., `/reset/*`).

3) Build and install the app (not Expo Go)

- Use an EAS development or production build. Universal Links do not work in Expo Go.
- After changing Associated Domains or AASA, reinstall on device.

---

## Android: App Links

1) Add an intent filter in `app.json`

````json
{
  "expo": {
    "android": {
      "package": "com.sproutbook.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            { "scheme": "https", "host": "app.sproutbook.com", "pathPrefix": "/invite" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
````

2) Host the Digital Asset Links file

- URL: `https://app.sproutbook.com/.well-known/assetlinks.json`
- Must be served with `Content-Type: application/json`, 200 OK, no redirects.

Minimal assetlinks.json example (update placeholders):

````json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.sproutbook.app",
      "sha256_cert_fingerprints": [
        "<YOUR_RELEASE_CERT_SHA256>"
      ]
    }
  }
]
````

Notes:
- Use the SHA-256 fingerprint of your release signing certificate.
- If you rotate keys or change package name, update this file and publish a new app build.

3) Build and install the app (not Expo Go)

- Use an EAS development or production build to test.

---

## Domain and Hosting

- Create subdomain `app.sproutbook.com` in DNS.
  - CNAME to your host (e.g., Vercel/Netlify/Firebase) or A record to your server.
- Ensure HTTPS with a valid certificate (automatic on most hosts once domain is connected).
- Serve `.well-known/apple-app-site-association` and `.well-known/assetlinks.json` with correct headers.

Firebase Hosting example (`firebase.json`):

````json
{
  "hosting": {
    "public": "public",
    "headers": [
      {
        "source": "/.well-known/apple-app-site-association",
        "headers": [{ "key": "Content-Type", "value": "application/json" }]
      },
      {
        "source": "/.well-known/assetlinks.json",
        "headers": [{ "key": "Content-Type", "value": "application/json" }]
      }
    ]
  }
}
````

Place files at:
- `public/.well-known/apple-app-site-association`
- `public/.well-known/assetlinks.json`

---

## Routing in the App (Expo Router)

- Create route handler: `src/app/invite/accept.tsx`
- This single route supports both:
  - `sproutbook://invite/accept?code=...`
  - `https://app.sproutbook.com/invite/accept?code=...`
- Make sure to read `code` from the query, store it transiently (see `src/features/family/inviteStore.ts`), and proceed through auth.

---

## IDs and Values to Keep in Sync

- iOS Bundle ID (in `app.json` → `ios.bundleIdentifier`) ⇄ AASA `appIDs` entries
- Apple Team ID ⇄ AASA `appIDs` prefix
- Android Package (in `app.json` → `android.package`) ⇄ assetlinks `package_name`
- Android SHA-256 signing cert ⇄ assetlinks `sha256_cert_fingerprints`
- Domain host `app.sproutbook.com` ⇄ iOS Associated Domains + Android intent filter + hosted files

---

## QA Checklist

- Tap `https://app.sproutbook.com/invite/accept?code=TEST123` on device with app installed
  - iOS: Opens app directly (no Safari) and navigates to `/invite/accept`
  - Android: First time may ask to open in app; then navigates to `/invite/accept`
- App receives `code` param and stores it transiently
- If logged out: goes to signup/login, then after verification accepts invite
- If logged in: accepts invite immediately
- Paywall bypass occurs for viewers after acceptance

---

## Troubleshooting

- iOS opens Safari instead of app
  - Check AASA URL returns 200 OK, JSON, no redirect, correct `appIDs` and `paths`
  - Confirm device has the app installed with matching bundle ID and is reinstalled after changes
  - Ensure `associatedDomains` includes `applinks:app.sproutbook.com`

- Android doesn’t offer to open the app
  - Verify `assetlinks.json` is valid JSON, 200 OK, correct `package_name` and SHA-256
  - Confirm `intentFilters` host/path match exactly
  - Use release/dev client built with same package and signing key used in assetlinks

- Link opens the wrong screen
  - Ensure `src/app/invite/accept.tsx` exists and Expo Router picks the path
  - Avoid extra redirects on the link URL

- Parameter `code` missing in app
  - Confirm the link contains `?code=...`
  - Verify your route reads query params correctly and stores it before navigating

---

## Implementation Steps (End-to-End)

1) Pick final IDs
   - iOS bundle ID: e.g., `com.sproutbook.app`
   - Android package: e.g., `com.sproutbook.app`
   - Domain: `app.sproutbook.com`
2) Configure `app.json` for iOS and Android (Associated Domains, intent filters, scheme)
3) Set up hosting and DNS for `app.sproutbook.com` with HTTPS
4) Deploy `.well-known/apple-app-site-association` and `.well-known/assetlinks.json`
5) Build the app (EAS dev or production) and install on device
6) Test with live links; iterate until QA checklist passes

---

## Placeholders to Replace

- `<APPLE_TEAM_ID>`: Your Apple Developer Team ID
- `com.sproutbook.app`: Final bundle/package IDs (must be lowercase for Android)
- `<YOUR_RELEASE_CERT_SHA256>`: Android release signing SHA-256 fingerprint

---

## References in Repo

- App config: `app.json`
- Invite route: `src/app/invite/accept.tsx` (to be added)
- Transient store: `src/features/family/inviteStore.ts`
- Frontend plan: `docs/FAMILY_SHARING_FRONTEND_PLAN.md` (Deep Links section)
- Viewer onboarding: `docs/FAMILY_SHARING_VIEWER_ONBOARDING.md`
