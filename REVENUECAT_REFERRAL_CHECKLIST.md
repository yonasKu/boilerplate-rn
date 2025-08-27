# RevenueCat Webhook & Referral/Promo Integration Checklist

Last updated: 2025-08-26 17:07 (+03:00)

## Prerequisites
- [ ] Firebase CLI installed and logged in (firebase login)
- [ ] Firebase project ID known (e.g., sproutbook-prod)
- [ ] RevenueCat dashboard access (to configure webhook)

## Webhook Secret & RevenueCat Portal
- [ ] Generate a long random token for webhook Authorization
- [ ] Set Firebase Functions secret `REVENUECAT_WEBHOOK_SECRET`
  - Command:
    - PowerShell (interactive):
      ```powershell
      firebase functions:secrets:set REVENUECAT_WEBHOOK_SECRET --project <PROJECT_ID>
      ```
- [ ] Configure RevenueCat webhook URL and Authorization header
  - URL (after deploy):
    ```
    https://us-central1-<PROJECT_ID>.cloudfunctions.net/revenuecatWebhook
    ```
  - Header:
    ```
    Authorization: Bearer <YOUR_SECRET_TOKEN>
    ```

## Deploy Functions and Rules
- [ ] Deploy `revenuecatWebhook` function
  ```powershell
  firebase deploy --only functions:revenuecatWebhook --project <PROJECT_ID>
  ```
- [ ] Deploy Firestore rules (root `firestore.rules`)
  ```powershell
  firebase deploy --only firestore:rules --project <PROJECT_ID>
  ```

## Verify Firestore Security Rules
- [ ] Ensure only backend can update `users/{uid}.subscription`
  - Rule: update allowed for backend-only on keys `['subscription','updatedAt']` in `firestore.rules`
- [ ] Ensure `revenuecatEvents` is backend-only read/write

## Send Test Webhook & Validate
- [ ] Send a test POST to the webhook with Authorization header
  - PowerShell example:
    ```powershell
    $body = '{"event":{"id":"evt_test_1","app_user_id":"<TEST_UID>","type":"INITIAL_PURCHASE","product_id":"premium_monthly","store":"APP_STORE","will_renew":true,"expires_at":"2099-12-31T23:59:59Z"}}'
    curl -X POST "https://us-central1-<PROJECT_ID>.cloudfunctions.net/revenuecatWebhook" -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_SECRET_TOKEN>" --data $body
    ```
- [ ] Confirm Firestore updates:
  - `revenuecatEvents/{evt_test_1}` exists with payload and processedAt
  - `users/{TEST_UID}.subscription` fields updated: `status`, `plan/productId`, `platform`, `willRenew`, `expirationDate`

## Referral & Promo Code Integration
- [x] Promo code modal integrated on pricing screen
  - Files: `src/features/subscriptions/components/PromoCodeModal.tsx`, `src/features/auth/screens/PricingScreen.tsx`
- [x] ReferralService helper `getPendingReferralIdByCode` implemented
  - File: `src/services/referralService.ts`
- [ ] Implement referral code flow in new user signup (in progress)
  - Prefill via `?ref=CODE` or dedicated screen at `src/app/(auth)/enter-invite.tsx`

## Promo/Gift Codes (implemented)
- [x] Backend callable `redeemPromoCode` (supports promo + gift cards, single-use gift, per-code compDays)
  - File: `functions/index.js` (exported as `exports.redeemPromoCode`)
- [x] Client redemption via `PromoCodeModal`
  - File: `src/features/subscriptions/components/PromoCodeModal.tsx`
  - Behavior: if unauthenticated, performs `signInAnonymously()` then calls the callable
- [x] Gating updated to honor `subscription.compUntil`
  - File: `src/hooks/useSubscription.ts` (treats user as active if `Date.now() < compUntil`)

### Anonymous redeem -> Link account
- Why: Comp is granted to the current UID. To keep comp after full sign-in, we must keep the same UID.
- How:
  - If `auth.currentUser.isAnonymous`, link the provider credential instead of signing in anew.
    - Apple: `src/features/auth/services/appleAuthService.ts` uses `linkWithCredential(...)` when anonymous
    - Google and Email: `src/lib/firebase/auth.ts` links when anonymous; otherwise signs in
  - Avoid: `signOut()` then `signInWith...` while anonymous (would create a new UID and orphan comp)
- Result: User keeps comp after upgrading login; no extra backend steps needed

## Monitoring & Logs
- [ ] Use Firebase Logs
  ```powershell
  firebase functions:log --only revenuecatWebhook --project <PROJECT_ID>
  ```
- [ ] Add alerts/dashboards as needed

## Rollback
- [ ] To rollback a faulty function deploy
  ```powershell
  firebase deploy --only functions:revenuecatWebhook@previous --project <PROJECT_ID>
  ```
