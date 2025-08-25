# Google Play Console — Subscriptions & Payments Setup (Sproutbook)

Use this guide to finish Payments/Merchant setup and create the Android subscription products with exact values. This complements `docs/REVENUECAT_REQUIREMENTS.md` and `docs/PRODUCT_IDS.md`.

- Source of truth for product IDs: `docs/PRODUCT_IDS.md`.
- Entitlement: `pro`
- Offering: `default`
- Products:
  - Monthly subscription — `sprout_pro_monthly_v1` — $5.99 USD
  - Annual subscription — `sprout_pro_yearly_v1` — $48.00 USD

---

## Roles & Access

- Owner/Admin: can create and manage the Payments profile (merchant account) and Play Console products.
- Finance: can view payments and financial reports (optional).

Direct link: https://play.google.com/console

---

## 1) Payments Profile / Merchant Account (must be Active)

You must have a payments profile (merchant account) before selling in-app products.

1) Play Console → left nav: Monetize → Monetization setup (or Payments setup).
2) Create a Payments profile (if prompted):
   - Business/Legal entity name: must match your legal documents exactly
   - Business address, contact name/email/phone
   - Primary currency
   - Website (optional but recommended)
3) Bank account: add a payout method (may require a small test deposit verification).
4) U.S. tax info: fill in in the Payments profile (W‑9 for U.S., W‑8BEN/W‑8BEN‑E for non‑U.S.).
5) Wait for verification. Monetization setup should show Active/Complete.

Common blockers:
- Payments profile not created or not verified
- No bank account added
- U.S. tax information not submitted (even for non‑U.S. sales via Google paying entity)

---

## 2) App Record & Package Name

- Create the app with the final Package Name (e.g., `com.yourco.sproutbook`).
- Upload at least one signed AAB (Android App Bundle). Use your release keystore or Play App Signing.
- Country/region availability should include your target markets.

---

## 3) Create Subscriptions (exact values)

Create each subscription in Play Console.

Navigation: Play Console → Monetize → Products → Subscriptions → Create subscription

### A) Monthly
- Product ID: `sprout_pro_monthly_v1`
- Title: `Sprout Pro Monthly`
- Description: `Unlock all premium features, including AI recaps, advanced journaling, and more.`

Base plan (required):
- Base plan ID: `p1m` (or any consistent ID)
- Renewal type: Auto‑renewing
- Price: set base price `US $5.99` (Google will localize; review country price list)
- Availability: all target countries
- Free trial / Intro offers: none (per current plan)
- Activate the base plan (status must become Active)

### B) Annual
- Product ID: `sprout_pro_yearly_v1`
- Title: `Sprout Pro Annual`
- Description: `Annual plan for all premium features at a discounted yearly rate.`

Base plan:
- Base plan ID: `p1y` (or any consistent ID)
- Renewal type: Auto‑renewing
- Price: set base price `US $48.00`
- Availability: all target countries
- Free trial / Intro offers: none
- Activate the base plan

Notes:
- Subscriptions remain unusable until at least one base plan is Active.
- If you add offers later, create them under each base plan (trial or intro pricing).

---

## 4) Activate Products

- Each subscription should show status Active.
- Each base plan under the subscription must also show Active (green check).

---

## 5) Internal Testing Track (required for test purchases)

Test purchases only work on builds installed via a Play testing track and with tester emails configured.

1) Release → Testing → Internal testing → Create new release → upload AAB → Review → Rollout to testers.
2) Testers:
   - Either add individual Gmail addresses as testers for the internal track, or
   - Use “Tester lists” and enroll users there.
3) License testing (recommended): Developer account settings → Monetization setup → License testing → add tester Gmail(s).
4) Copy the opt‑in link and install the app on the tester device via that link (not by sideloading).

---

## 6) RevenueCat Mapping

- Create Products in RevenueCat with the exact IDs above and link to Play products.
- Create Entitlement: `pro`
- Create Offering: `default`
- Add Packages:
  - `monthly` → `sprout_pro_monthly_v1`
  - `annual` → `sprout_pro_yearly_v1`

---

## Copy‑Paste Values

```
Package Name: com.yourco.sproutbook

Subscription #1
Product ID: sprout_pro_monthly_v1
Title: Sprout Pro Monthly
Description: Unlock all premium features, including AI recaps, advanced journaling, and more.
Base plan ID: p1m
Renewal: Auto-renewing
US Price: 5.99
Availability: all target countries
Offers: none

Subscription #2
Product ID: sprout_pro_yearly_v1
Title: Sprout Pro Annual
Description: Annual plan for all premium features at a discounted yearly rate.
Base plan ID: p1y
Renewal: Auto-renewing
US Price: 48.00
Availability: all target countries
Offers: none
```

---

## Troubleshooting

- Purchases not available / test dialog doesn’t appear:
  - Install from Internal testing link (not sideloaded APK).
  - Ensure the tester Gmail is enrolled in the track and in License testing.
  - Make sure the Play Store app is using the tester account on device; clear cache if needed.
- No prices or “Not available in your country”:
  - Base plan not Active, or country not enabled in the base plan.
- “Item unavailable” or Billing error:
  - App not signed/installed via Play; build not yet rolled out; wrong package name vs product IDs.
- RevenueCat shows empty offering:
  - Products not Active in Play or not linked in RevenueCat; Offering packages not pointing to the correct product IDs.

---

## References

- Product IDs and pricing: `docs/PRODUCT_IDS.md`
- Requirements overview: `docs/REVENUECAT_REQUIREMENTS.md`
- Integration steps: `docs/REVENUECAT_INTEGRATION.md`
- Play Console help: https://support.google.com/googleplay/android-developer
