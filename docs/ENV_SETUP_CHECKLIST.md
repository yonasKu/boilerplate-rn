# Environment and Webhook Setup Checklist

This checklist tells you EXACTLY what is already implemented, what you must configure, and how to deploy. Keep this doc next to `docs/REVENUECAT_BACKEND_PLAN.md`.

## What’s Implemented (Backend)
- **RevenueCat Webhook**: `functions/functions/revenuecatWebhook.js`
  - Authorization header verification: `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`
  - Idempotency via `x-event-id` (or body hash)
  - Audit log: writes raw payload to `revenuecatEvents/{eventId}`
  - Updates `users/{uid}.subscription` with normalized fields
- **Exported Function**: `functions/index.js` exposes `exports.revenuecatWebhook`
- **Env Validation**: `functions/utils/environmentValidator.js` includes optional `REVENUECAT_WEBHOOK_SECRET`
- **Security Rules**: `firestore.rules`
  - Clients cannot update `users/{uid}.subscription`
  - Backend-only `revenuecatEvents/{eventId}`

## What You Must Configure (Action Items)
- **Local .env (Functions)**
  - File path: `functions/.env`
  - Add/update these keys exactly:
    ```bash
    PROJECT_ID=your-firebase-project-id
    OPENAI_API_KEY=sk-...
    REVENUECAT_WEBHOOK_SECRET=whsec_...
    # Emulators (optional)
    FIRESTORE_EMULATOR_HOST=localhost:8080
    AUTH_EMULATOR_HOST=localhost:9099
    STORAGE_EMULATOR_HOST=localhost:9199
    ```
  - Note: The runtime checks `PROJECT_ID` (not `FIREBASE_PROJECT_ID`). Keep `PROJECT_ID`.
  - If you previously used `FIREBASE_AUTH_EMULATOR_HOST` or `FIREBASE_STORAGE_EMULATOR_HOST`, replace with the keys above.

- **Production Secrets (Secret Manager)**
  - Set the webhook token (used as Authorization Bearer):
    ```bash
    firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET
    ```
  - The function already requests this secret; no code change required.

- **RevenueCat Dashboard**
  - Webhook URL:
    ```
    https://us-central1-<PROJECT_ID>.cloudfunctions.net/revenuecatWebhook
    ```
  - Authorization header value: `Bearer <REVENUECAT_WEBHOOK_SECRET>`
  - Ensure events are enabled for the app(s) you use.

- **Deploy**
  - Deploy rules:
    ```bash
    firebase deploy --only firestore:rules
    ```
  - Deploy function:
    ```bash
    firebase deploy --only functions:revenuecatWebhook
    ```

## Verification (Optional but Recommended)
- **Local/emulator test** (Authorization header):
  1) Save sample JSON as `event.json`.
  2) POST to your emulator/prod endpoint with header `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
  3) Expect 200 `{ ok: true, processed: true }` and Firestore docs:
     - `revenuecatEvents/{eventId}` (audit)
     - `users/{uid}.subscription` updated

## Frontend/Service Follow-ups (Not done yet)
- **SubscriptionService** (`src/services/subscriptionService.ts`):
  - `getSubscriptionStatus(userId)` -> reads `users/{uid}.subscription`
  - `hasActiveSubscription(userId)` -> true for `active|trial` and not expired
  - `getFeatureFlags(userId)` / `hasFeatureAccess(userId, key)` -> optional feature flags
- **App Integration**:
  - Install RevenueCat: `npx expo install react-native-purchases`
  - Add plugin to `app.json`: `"plugins": ["react-native-purchases"]`
  - Identify with Firebase UID via `Purchases.logIn(uid)`
  - Fetch offerings, render paywall, purchase/restore flows
  - Gate premium features off `useSubscription()` (`status === 'active' || status === 'trial'`)

## Quick Punch List
- [ ] Set `functions/.env` with `PROJECT_ID`, `OPENAI_API_KEY`, `REVENUECAT_WEBHOOK_SECRET`
- [ ] Update emulator env keys to `AUTH_EMULATOR_HOST`/`STORAGE_EMULATOR_HOST` if needed
- [ ] `firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET` (prod)
- [ ] Configure RevenueCat webhook URL + Authorization header
- [ ] `firebase deploy --only firestore:rules`
- [ ] `firebase deploy --only functions:revenuecatWebhook`
- [ ] Build frontend subscription service and gating
