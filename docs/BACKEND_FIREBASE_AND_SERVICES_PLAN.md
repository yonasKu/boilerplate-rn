# Backend: Firestore Rules, Indexes, and Services Plan

## Summary
This document captures what is DONE vs TODO across Firestore rules/indexes and service layers, and outlines upcoming features (Family Sharing, Referral Program, Subscription & Monetization) with required collections, rules, and service files.

---

## Firestore Rules

- __Children (`/children`)__
  - DONE: Rules updated to accept multiple gender values and flexible `dateOfBirth` formats.
  - DONE: App now stores canonical gender values: `"Boy" | "Girl" | "Don't know yet" | 'prefer_not_to_say'`.
  - TODO: Consider removing legacy allowances (e.g., `male/female/other`) after data migration.

- __Recap Comments (`/recapComments`)__
  - DONE: Rules validate optional image context fields (`imageUrl`, `imageThumbUrl`, `imageIndex`, `imageStoragePath`).
  - DONE: Read permission restricted to users authorized to view parent recap (family members or backend code paths).
  - TODO: Optional: add `isImageComment` boolean to simplify queries and rules conditions.

- __Users (`/users`)__
  - DONE: Owner read/write pattern in place; supports updating `children` array and `lifestage`.

---

## Firestore Indexes

- __Recap Comments queries__
  - TODO: Create composite indexes for new query patterns
    - `recapId, createdAt` (ascending)
    - `recapId, imageIndex, createdAt` (ascending)
    - `recapId, imageUrl, createdAt` (ascending)

---

## Implemented App Changes (cross-cutting)

- __Gender normalization__
  - DONE: `AddChildDetailsScreen` maps display label "Prefer not to say" → stored `'prefer_not_to_say'`.
  - DONE: `EditChildProfileScreen` maps stored `'prefer_not_to_say'` ↔ display label.
  - DONE: `useAddChildDetails` aligns options and storage mapping.
  - DONE: `useAddChildDetails` now falls back to `users/{uid}.lifestage` when route param is missing.
  - DONE: `docs/CHILD_COLLECTION_SCHEMA.md` updated to canonical gender set.

- __Image-specific recap comments__
  - DONE: UI + service support optional image context; thumbnail rendering in `CommentItem`.
  - DONE: Rules updated as above; indexes pending.

---

## Services Layer (status and plan)

- __Existing__
  - `src/services/childService.ts` (add/get/update child profiles)
  - `src/services/userService.ts` (user profile + image upload helpers)
  - `src/features/recaps/services/recapCommentsService.ts` (comments)

- __Planned/Needed__
  - AI Recaps Service: `src/features/recaps/services/aiRecapService.ts`
    - Methods: `createRecap`, `getRecaps`, `updateRecapStatus`, `deleteRecap`
    - Collection: `aiRecaps`
  - Family Sharing Service: `src/features/family/services/familyService.ts`
    - Methods: `createInvitation`, `acceptInvitation`, `getFamilyMembers`, `updatePermissions`
    - Collections: `invitations`, `sharedAccess`, extended fields in `users`
  - Referral Service: `src/features/referral/services/referralService.ts`
    - Methods: `createReferral`, `getReferrals`, `completeReferral`, `getPromoCodes`
    - Collections: `referrals`, `promoCodes`
  - Subscription Service: `src/features/subscription/services/subscriptionService.ts`
    - Methods: `getSubscriptionStatus`, `updateCredits`, `getFeatureFlags`
    - Collections: `aiCredits`, `featureFlags` (payments handled by app-side integrations)

---

## Feature Specs and Data Model Notes

### Family Sharing (View-Only Accounts)
- __Capabilities__
  - Invite via SMS/email; recipients create free, view-only accounts
  - Recaps automatically shared with viewers; notifications on new recaps
  - No editing/journaling for viewers; can like/comment on recaps/journal entries
  - Search/filter by age, milestones, favorites (like full accounts)
  - Paid (full) users can be invited as viewers of another timeline
  - View-only accounts can upgrade to full journaling accounts

- __Collections__
  - `invitations`: { inviterId, inviteeContact, role: 'viewer', status: 'pending|accepted|revoked', createdAt }
  - `sharedAccess`: { ownerId, viewerId, scopes: ['recaps:read', 'comments:write'], createdAt }

- __Rules__
  - Viewers: read owner’s shared recaps/journals; write likes/comments where allowed
  - Owners: manage invitations and access lists

- __Services__
  - `createInvitation`, `acceptInvitation`, `getFamilyMembers`, `updatePermissions`

### Referral Program
- __Capabilities__
  - Each user has unique promo/referral code
  - Friend uses code during signup/paywall; friend receives trial/discount; (v1: referrer no reward)

- __Collections__
  - `promoCodes`: { code, type: 'trial|discount', value, maxRedemptions?, expiresAt?, createdBy? }
  - `referrals`: { referrerId, referredUserId, code, redeemedAt }

- __Rules__
  - Validate code usage; prevent over-redemption; allow read for code-checking and write on redemption

- __Services__
  - `getPromoCodes`, `createReferral`, `getReferrals`, `completeReferral`

### Subscription & Monetization
- __Capabilities__
  - Mobile web checkout (Stripe or platform pay), optional in-app purchase flow
  - Plans: $5.99 monthly, $48.00 annual
  - Promo codes: one-time/recurring, trials/discounts; gift cards via promo codes

- __Collections__
  - `aiCredits`: { userId, credits, updatedAt }
  - `featureFlags`: { userId, flags: { ... }, updatedAt }

- __Rules__
  - Users can read their own subscription-related docs; server-side functions update credits/flags

- __Services__
  - `getSubscriptionStatus`, `updateCredits`, `getFeatureFlags`

---

## Action Items Checklist

- __Indexes__
  - [ ] Create composite indexes for `recapComments` query patterns

- __Rules__
  - [ ] Optional: add `isImageComment` field to comment schema and rules
  - [ ] Optional: tighten `/children` gender validations after migration

- __Services__
  - [ ] Scaffold `aiRecapService.ts`
  - [ ] Scaffold `familyService.ts`
  - [ ] Scaffold `referralService.ts`
  - [ ] Scaffold `subscriptionService.ts`

- __Docs/QA__
  - [ ] QA recapComments rules with emulator
  - [ ] QA add/edit child flows with canonical genders
  - [ ] Update README or platform-specific guides with checkout/paywall integration notes
