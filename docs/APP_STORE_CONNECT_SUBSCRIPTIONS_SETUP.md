# App Store Connect — Subscriptions & Agreements Setup (Sproutbook)

Use this guide to finish Agreements/Tax/Banking and create the iOS subscription products with exact values. This complements `docs/REVENUECAT_REQUIREMENTS.md` and `docs/PRODUCT_IDS.md`.

- Source of truth for product IDs: `docs/PRODUCT_IDS.md`.
- Entitlement: `pro`
- Offering: `default`
- Products:
  - Monthly subscription — `sprout_pro_monthly_v1` — $5.99 USD
  - Annual subscription — `sprout_pro_yearly_v1` — $48.00 USD

---

## Roles & Access

- Account Holder: required to accept the "Paid Applications" agreement.
- Admin/Finance: can add Banking and Tax, but cannot accept the agreement.

Direct link: https://appstoreconnect.apple.com/agreements

---

## 1) Agreements, Tax, and Banking (must show Active)

1) Sign in as the Account Holder → App Store Connect → Agreements, Tax, and Banking.
2) Under Agreements:
   - Find "Paid Applications" → click Request/Set Up or View and Agree → accept.
3) Banking tab → Add Bank Account:
   - Account holder name: must match your legal entity exactly
   - Country/Region, Bank name/address
   - US: Routing (ABA) + Account number
   - Non‑US: IBAN + SWIFT/BIC
   - Submit (status may show Pending Verification until approved)
4) Tax tab → US Tax Forms:
   - US entity: W‑9 (EIN/SSN, legal name, address)
   - Non‑US entity: W‑8BEN‑E (company) or W‑8BEN (individual)
5) Back to Agreements → "Paid Applications" should show Active once Banking + Tax are approved.

Common blockers:
- Not signed in as Account Holder
- Bank account name doesn’t match legal entity
- Wrong tax form or TIN/EIN

---

## 2) Create the Subscription Group

- In the app record: Distribution → Subscriptions → Create Subscription Group
- Group name: `Sprout Pro`
- Family Sharing: OFF (we handle family sharing in backend/Firebase)

Blue info banner meaning (Apple UI): Your first subscription must be submitted with a new app version. Create subscriptions, upload a build, then select the subscriptions on the Version page and submit. Subsequent subscriptions can be submitted from the Subscriptions page.

---

## 3) Create Subscriptions (exact values)

Create each subscription from within the `Sprout Pro` group.

### A) Monthly
- Reference Name: `Sprout Pro Monthly`
- Product ID: `sprout_pro_monthly_v1`

After creation, set:
- Duration: `1 Month`
- Pricing: `US $5.99` (Apple will localize)
- Localization:
  - Display Name: `Sprout Pro Monthly`
  - Description: `Unlock all premium features, including AI recaps, advanced journaling, and more.`
- Review Screenshot: 1024×1024 PNG/JPG (feature or branding image)
- Cleared for Sale: `ON`
- Availability: all target countries
- Intro Offer / Free Trial: none (per current plan)

### B) Annual
- Reference Name: `Sprout Pro Annual`
- Product ID: `sprout_pro_yearly_v1`

After creation, set:
- Duration: `1 Year`
- Pricing: `US $48.00`
- Localization:
  - Display Name: `Sprout Pro Annual`
  - Description: `Annual plan for all premium features at a discounted yearly rate.`
- Review Screenshot: 1024×1024 PNG/JPG
- Cleared for Sale: `ON`
- Availability: all target countries
- Intro Offer / Free Trial: none

---

## 4) Attach to Build (first submission requirement)

- Upload a TestFlight build.
- Open the app Version page → In‑App Purchases & Subscriptions section → add `Sprout Pro Monthly` and `Sprout Pro Annual` → submit for review.

---

## 5) RevenueCat Mapping

- Create Products in RevenueCat with the exact IDs above and link to the App Store products.
- Create Entitlement: `pro`
- Create Offering: `default`
- Add Packages:
  - `monthly` → `sprout_pro_monthly_v1`
  - `annual` → `sprout_pro_yearly_v1`

---

## Copy‑Paste Values

```
Group Name: Sprout Pro

Subscription #1
Reference Name: Sprout Pro Monthly
Product ID: sprout_pro_monthly_v1
Duration: 1 Month
US Price: 5.99
Display Name: Sprout Pro Monthly
Description: Unlock all premium features, including AI recaps, advanced journaling, and more.

Subscription #2
Reference Name: Sprout Pro Annual
Product ID: sprout_pro_yearly_v1
Duration: 1 Year
US Price: 48.00
Display Name: Sprout Pro Annual
Description: Annual plan for all premium features at a discounted yearly rate.
```

---

## 6) Generate In‑App Purchase Key (.p8) for RevenueCat (StoreKit 2)

RevenueCat needs the App Store In‑App Purchase (IAP) key to reliably record StoreKit 2 transactions. Without it, sync can fail and prices may not appear.

Steps (App Store Connect):
- Users and Access → Keys → In‑App Purchase → “+” → Name it → Generate.
- Download the `.p8` file now (you can only download it once).
- Copy the Key ID for this key.

Who can do this:
- Account Holder or Admin with access to Users and Access.

What to provide to RevenueCat:
- The `.p8` file and its Key ID. (Issuer ID is not required for this IAP key.)

You will upload this in RevenueCat under the iOS app config → “In‑app purchase key configuration”.

---

## Troubleshooting

- I can’t see Agreements/Tax/Banking → you’re not the Account Holder. Ask the Account Holder to activate it or grant Finance role for visibility.
- Prices don’t show in app → ensure products are Cleared for Sale, attached to a build, and pricing is set.
- Sandbox purchase fails → use TestFlight or a custom dev client (not Expo Go), sign into the device with a Sandbox tester, and try again.

---

## References

- Product IDs and pricing: `docs/PRODUCT_IDS.md`
- Requirements overview: `docs/REVENUECAT_REQUIREMENTS.md`
- Integration steps: `docs/REVENUECAT_INTEGRATION.md`
