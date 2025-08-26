# SproutBook Services Integration Guide

## Overview
This guide covers how to integrate the newly created Firestore services into the SproutBook React Native app.

## Available Services

### 1. AI Recaps Service (`aiRecapService.ts`)
**Purpose**: Manage AI-generated journal recaps
**Key Methods**:
- `createRecap()` - Generate new AI recap
- `getRecaps()` - Get user's recaps
- `updateRecapStatus()` - Update recap status
- `deleteRecap()` - Remove recap

### 2. Family Sharing Service (`familyService.ts`)
**Purpose**: Handle family sharing invitations and permissions
**Key Methods**:
- `createInvitation()` - Send family sharing invite
- `acceptInvitation()` - Accept pending invitation
- `getInvitations()` - View sent invitations
- `createSharedAccess()` - Grant access to children

### 3. Referral Service (`referralService.ts`)
**Purpose**: Manage referral program and promo codes
**Key Methods**:
- `createReferral()` - Create new referral
- `getReferrals()` - View user's referrals
- `completeReferral()` - Mark referral as complete
- `getPromoCodes()` - Get active promo codes

### 4. Subscription Service (`subscriptionService.ts`)
**Purpose**: Handle subscriptions and feature access
**Key Methods**:
- `getSubscriptionStatus(userId)` - Read normalized subscription snapshot from `users/{uid}.subscription`
- `hasActiveSubscription(userId)` - Boolean gating for active/trial and not expired
- `getFeatureFlags(userId)` - Read optional feature flags document
- `hasFeatureAccess(userId, featureKey)` - Boolean gating for a single feature flag

## Integration Steps

### Step 1: Import Services
```typescript
import { aiRecapService } from '../services/aiRecapService';
import { familyService } from '../services/familyService';
import { referralService } from '../services/referralService';
import { SubscriptionService } from '../services/subscriptionService';
```

### Step 2: Basic Usage Examples

#### AI Recaps
```typescript
// Create a new recap
const recapId = await aiRecapService.createRecap({
  userId: userId,
  childIds: ['child1', 'child2'],
  timeRange: { start: startDate, end: endDate },
  status: 'pending'
});

// Get user's recaps
const recaps = await aiRecapService.getRecaps(userId);
```

#### Family Sharing
```typescript
// Send invitation
const invitationId = await familyService.createInvitation({
  senderUserId: currentUserId,
  recipientEmail: 'family@example.com',
  invitationType: 'family_view',
  permissions: { canViewEntries: true, canEditEntries: false, canAddChildren: false },
  childrenAccess: ['child1', 'child2']
});

// Accept invitation
await familyService.acceptInvitation(invitationId, recipientUserId);
```

#### Referrals
```typescript
// Create referral
const referralId = await referralService.createReferral({
  referrerUserId: currentUserId,
  referredEmail: 'friend@example.com',
  referralCode: 'SPRING2024'
});

// Get promo codes
const codes = await referralService.getPromoCodes();
```

#### Subscriptions
```typescript
// Check subscription status (read-only; written by backend webhook)
const sub = await SubscriptionService.getSubscriptionStatus(userId);

// Gate access based on subscription
const allowed = await SubscriptionService.hasActiveSubscription(userId);

// Feature flags (optional)
const flags = await SubscriptionService.getFeatureFlags(userId);
const canExport = await SubscriptionService.hasFeatureAccess(userId, 'exportData');
```

### Step 3: Error Handling
```typescript
try {
  const result = await service.methodName(params);
  // Handle success
} catch (error) {
  console.error('Service error:', error);
  // Show user-friendly error message
}
```

### Step 4: UI Integration
- Add loading states for async operations
- Implement proper error boundaries
- Use React Query or similar for caching
- Add optimistic updates where appropriate

## Testing Checklist

- [ ] Test each service method with valid data
- [ ] Test error handling with invalid data
- [ ] Verify Firestore rules allow operations
- [ ] Test with demo mode enabled/disabled
- [ ] Verify user permissions are respected

## Security Notes
- All services respect Firestore security rules
- User ID is required for most operations
- Permissions are validated server-side
- In demo/dev builds, feature flags may default to enabled for testing

## Next Steps
1. Integrate services into existing screens
2. Add loading and error states
3. Implement real-time updates where needed
4. Add user feedback for async operations
