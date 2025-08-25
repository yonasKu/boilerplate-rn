# Product IDs and Monetization Reference

Single source of truth for product identifiers, pricing, store mapping, and promo/gift strategy. Keep this document updated before making store changes.

---

## Catalog (authoritative)
- Entitlement: `pro`
- Offering: `default`
- Products (IDs identical in App Store, Play Console, and RevenueCat)
  - Monthly subscription: `sprout_pro_monthly_v1` — USD $5.99
  - Annual subscription: `sprout_pro_yearly_v1` — USD $48.00 (≈33% discount vs monthly)
 
- Gift card (not a store product): one‑year access via unique promo code sold on web for USD $59.99

Notes:
- Prices above are base USD; set localized pricing in each store.

---

## Naming rules
- Lowercase, `snake_case`, no spaces.
- Do not include platform suffixes (no `.ios` / `.android`).
- Do not rename after launch.

Examples:
- `sprout_pro_monthly_v1`, `sprout_pro_yearly_v1`, `sprout_pro_lifetime`

---

## Store mapping checklist
- App Store Connect
  - Create subscription group and these products with the exact IDs.
  - Configure pricing/locales. Configure Intro/Promotional Offers if needed.
  - Submit with a build and clear for sale.
- Google Play Console
  - Create subscriptions (base plans + offers) using the same IDs.
  - Activate products, set prices/locales. Internal testing track ready.
- RevenueCat
  - Create Products matching the IDs and link to App Store/Play products.
  - Create Entitlement `pro`.
  - Create Offering `default` with packages: `monthly` → `sprout_pro_monthly_v1`, `annual` → `sprout_pro_yearly_v1`.

---

## App integration alignment
- Identity: set `appUserID = Firebase UID` after login.
- Configure at app start: `Purchases.configure({ apiKey: <platform public key> })`.
- After login: `await Purchases.logIn(uid)`; on logout: `await Purchases.logOut()`.
- Use existing Pricing screen in onboarding as the paywall:
  - Fetch offerings → list `monthly` and `annual` packages with localized prices.
  - Purchase package → check `customerInfo.entitlements.active["pro"]`.
  - Provide Restore Purchases.
- Gate premium features: if no active `pro`, route to Pricing.

---

## Promotions and trials
- Built‑in store mechanisms (recommended)
  - iOS: Intro Offers and Offer Codes (App Store Connect). Present code redemption where appropriate.
  - Android: Base plan offers/intro pricing (Play Console).
  - RevenueCat reads/store‑syncs these automatically.
- Custom promo code system (backend‑driven)
  - Use RevenueCat Promotional Entitlements via backend: grant `pro` to an `appUserID` for a duration.
  - Code types:
    - One‑time unique codes (e.g., “Annual gift card” → 12 months entitlement)
    - Non‑unique campaign codes (e.g., “1‑month trial” distributed via ads/channels)
  - Redemption flow (in‑app): user enters code → backend validates → grants entitlement through RevenueCat → app refreshes `CustomerInfo`.

Compliance notes:
- Use StoreKit/Play Billing for in‑app purchases.
- Selling a “gift card” for digital content should be done on the web (Stripe/checkout). Codes can be redeemed in app.

---

## Payment options policy
- In‑app (for digital access): must use Apple IAP (StoreKit) / Google Play Billing. You cannot use Apple Pay / Google Pay / direct card checkout inside the native apps for digital content.
- Web: You may sell gift cards or subscriptions with Apple Pay/Google Pay/cards on the website. Follow platform guidelines about linking to external payments from the app.

---

## Gift cards plan (requested)
- Annual gift card: unique one‑time promo code priced at USD $59.99 (sold on web, not in the app). Redeemable in app; grants 12 months of `pro`.
- One‑month trial promo codes: not unique, not sold as gift cards. Distributed via specific ads/channels. Backend validates usage rules (e.g., new users only, one per account).
- Sharing: After purchase (web), send the code via email/SMS. In app, provide a “Redeem code” entry.

---

## Testing matrix
- iOS (Sandbox): verify offerings, purchase monthly/annual, restore, and redeem promo code flow (backend promotional entitlement).
- Android (Internal testing): same as above. Ensure testers installed from Play testing link and are license testers.

---

## Appendix: example mapping
```json
{
  "entitlement": "pro",
  "offering": "default",
  "packages": {
    "monthly": "sprout_pro_monthly_v1",
    "annual": "sprout_pro_yearly_v1"
  },
  "pricesUSD": {
    "sprout_pro_monthly_v1": 5.99,
    "sprout_pro_yearly_v1": 48.00
  }
}
```
