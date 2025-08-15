# Updated Authentication Flow - SproutBook

## Current Finalized Onboarding Flow

### Complete Navigation Sequence

```
Welcome → Signup → Pricing → Checkout → Success → Login → AddProfileScreen → AddChildDetailsScreen → Main App
```

### Detailed Flow Breakdown

#### 1. Welcome Screen (`/welcome`)
- **Purpose**: App introduction and onboarding start
- **Navigation**: "Get Started" → `/signup`

#### 2. Signup Screen (`/signup`)
- **Purpose**: Create new user account
- **Actions**:
  - Creates Firebase Auth user
  - Creates Firestore user profile with subscription data
  - Sets `onboarded: false`
- **Navigation**: After successful signup → `/pricing`

#### 3. Pricing Screen (`/pricing`)
- **Purpose**: Plan selection (monthly/annual)
- **Actions**: User selects subscription plan
- **Navigation**: "Continue to Checkout" → `/checkout`

#### 4. Checkout Screen (`/checkout`)
- **Purpose**: Confirm trial/subscription details
- **Actions**: Confirms subscription setup
- **Navigation**: "Start Free Trial" → `/success`

#### 5. Success Screen (`/success`)
- **Purpose**: Celebration and confirmation
- **Features**: Confetti animation, success message
- **Navigation**: "Continue to Login" → `/login`

#### 6. Login Screen (`/login`)
- **Purpose**: Authenticate existing user
- **Actions**: Firebase Auth sign-in
- **Navigation**: After successful login → `/add-profile`

#### 7. AddProfileScreen (`/add-profile`)
- **Purpose**: Complete user profile (lifestage only)
- **Actions**:
  - Updates `lifestage` field in user document
  - Shows name/email as read-only
- **Navigation**: After completion → `/add-child-details`

#### 8. AddChildDetailsScreen (`/add-child-details`)
- **Purpose**: Add child information
- **Actions**:
  - Creates child document in `children` collection
  - Updates user's `children` array with child ID
  - Sets `onboarded: true`
- **Navigation**: After adding child → `/(main)/(tabs)/journal`

#### 9. Main App (`/(main)/(tabs)/journal`)
- **Purpose**: Full app access
- **Features**: Journal, Recaps, Search, New Entry tabs

## Firestore Schema Implementation

### Users Collection (`users/{uid}`)

```typescript
interface User {
  name: string;                    // User's full name
  email: string;                   // User's email address
  subscription: {
    plan: 'monthly' | 'annual';    // Subscription plan type
    status: 'active' | 'trial' | 'cancelled'; // Current status
    startDate: Timestamp;          // Subscription start date
    trialEndDate: Timestamp;       // Trial period end date
  };
  lifestage: string;               // Parenting stage (e.g., "expecting", "newborn", "toddler")
  children: string[];              // Array of child document IDs
  onboarded: boolean;              // Profile completion flag
  createdAt: Timestamp;            // Account creation timestamp
  updatedAt: Timestamp;            // Last update timestamp
}
```

### Children Collection (`children/{childId}`)

```typescript
interface Child {
  parentId: string;                // Reference to parent user UID
  name: string;                    // Child's name
  dateOfBirth: Timestamp;          // Child's date of birth
  gender: 'male' | 'female' | 'prefer_not_to_say'; // Child's gender
  avatar: string;                  // Avatar URL or identifier
  createdAt: Timestamp;            // Child record creation timestamp
  updatedAt: Timestamp;            // Last update timestamp
}
```

## Key Implementation Details

### Data Creation Flow
1. **Signup**: Creates user profile with subscription data
2. **Login**: Authenticates user (no data creation)
3. **AddProfileScreen**: Updates lifestage only
4. **AddChildDetails**: Creates child document and updates user.children array

### Navigation Stack
- Uses `router.replace()` for clean navigation (no back button issues)
- Success screen provides clear transition between checkout and login
- All screens use proper Expo Router paths

### Security Rules
- Users can only access their own user document
- Users can only access children with matching parentId
- All operations require authentication

## Testing Checklist

- [ ] Signup creates user with subscription data
- [ ] Pricing screen shows plan options
- [ ] Checkout screen confirms trial/subscription
- [ ] Success screen displays celebration
- [ ] Login authenticates user
- [ ] AddProfileScreen updates lifestage only
- [ ] AddChildDetails creates child and updates user.children
- [ ] Navigation flow works end-to-end
- [ ] Firestore permissions work correctly
