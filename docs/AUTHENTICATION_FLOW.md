# Authentication Flow Analysis

## Overview
This document analyzes the complete authentication flow for the SproutBook app, covering signup, login, onboarding, and user profile management across different user states.

## Authentication Architecture

### **Firebase Services Used**
- **Firebase Authentication** - User authentication (email/password, Google)
- **Cloud Firestore** - User profile storage
- **Expo Auth Session** - Google Sign-In integration

### **Authentication Context**
- **File**: `src/context/AuthContext.tsx`
- **Purpose**: Global authentication state management
- **Key Functions**: `useAuth()` hook provides user state, loading, and auth methods

## Complete Authentication Flow

### **1. New User Signup Flow**

#### **Step 1: Signup Screen**
- **File**: `src/features/auth/screens/SignUpScreen.tsx`
- **Route**: `/(auth)/signup`
- **Process**:
  1. User enters: **Name**, **Email**, **Password**
  2. **Name** is split into `firstName` and `lastName`
  3. **Google Sign-In** option available
  4. **Validation**: All fields required, email format, password strength

#### **Step 2: Firebase Auth Creation**
- **Function**: `signUpWithEmail()` in `src/lib/firebase/auth.ts`
- **Actions**:
  - Creates user in Firebase Auth
  - **Does NOT** update Firebase Auth displayName (kept simple)
  - Creates Firestore document: `users/{uid}`
  - **Initial Data**:
    ```typescript
    {
      uid: string,
      email: string,
      firstName: string,
      lastName: string,
      createdAt: Date,
      onboarded: true
    }
    ```

#### **Step 3: Success Screen**
- **Route**: `/(auth)/success`
- **Purpose**: Transition to onboarding flow

#### **Step 4: Profile Setup**
- **File**: `src/features/auth/screens/AddProfileScreen.tsx`
- **Route**: `/(auth)/add-profile`
- **Process**:
  1. User enters: **Name** (single field), **Life Stage**
  2. **Email** pre-filled from auth
  3. **Save Profile**: Updates Firestore user document
  4. **Data Structure**:
    ```typescript
    {
      uid: string,
      name: string,        // Single name field
      email: string,
      lifestage: string    // 'Soon to be parent' | 'Parent'
    }
    ```

### **2. Existing User Login Flow**

#### **Step 1: Login Screen**
- **File**: `src/features/auth/screens/LoginScreen.tsx`
- **Route**: `/(auth)/login`
- **Process**:
  1. User enters: **Email**, **Password**
  2. **Google Sign-In** option available
  3. **Validation**: Both fields required

#### **Step 2: Firebase Authentication**
- **Function**: `signInWithEmail()` in `src/lib/firebase/auth.ts`
- **Actions**:
  - Validates credentials against Firebase Auth
  - **No profile creation** (user already exists)
  - **AuthContext** handles redirect automatically

### **3. Google Sign-In Flow**

#### **Process**:
- **Hook**: `useGoogleSignIn()` in `src/lib/firebase/auth.ts`
- **Actions**:
  1. **Expo Auth Session** initiates Google OAuth
  2. **Firebase Auth** creates/updates user
  3. **Firestore** creates user document if new
  4. **Auto-redirect** handled by AuthContext

### **4. User Profile Management**

#### **Profile Data Storage**
- **Location**: Firestore `users/{uid}` collection
- **Fields**:
  - `uid` - Firebase Auth UID
  - `email` - User email
  - `name` - Single name field (as requested)
  - `lifestage` - Life stage selection
  - `createdAt` - Account creation timestamp

#### **Profile Updates**
- **Settings Screen**: `src/features/settings/screens/SettingsScreen.tsx`
- **My Profile Screen**: `src/features/settings/screens/MyProfileScreen.tsx`
- **Update Method**: `saveUserProfile()` in `src/services/userService.ts`

## User States & Navigation

### **New User Flow (with subscription)**
```
Onboarding → Welcome → Signup → Success → Pricing → Checkout → Login
```

### **Existing User Flow**
```
Welcome → Login → Add Profile → Add Child Details → Main App
```

### **Authentication State Handling**
- **Protected Routes**: `(main)/*` requires authentication
- **Auth Routes**: `(auth)/*` only accessible when not authenticated
- **Redirect Logic**: Handled by AuthContext and route guards

## Error Handling & Validation

### **Signup Validation**
- **Email**: Format validation, uniqueness check
- **Password**: Strength requirements
- **Name**: Required, split into first/last name
- **Error Messages**: User-friendly Firebase error codes

### **Login Validation**
- **Email**: Format validation
- **Password**: Required field
- **Error Messages**: Invalid credentials, network issues

### **Firestore Security**
- **Rules**: Users can only read/write their own profile
- **Document ID**: Matches Firebase Auth UID
- **Merge Updates**: Profile updates don't overwrite other fields

## Authentication Context Integration

### **AuthContext Usage**
```typescript
const { user, loading, refreshOnboardingStatus } = useAuth();
```

### **Profile Data Access**
- **JournalScreen**: Displays user name from Firestore
- **SettingsScreen**: Displays user profile data
- **MyProfileScreen**: Full profile display and editing

## Key Design Decisions

### **Single Name Field**
- **Rationale**: Simplified UX, consistent with user request
- **Implementation**: Name split into first/last only during signup
- **Storage**: Single `name` field in Firestore

### **No Firebase Auth Profile Updates**
- **Rationale**: Keep Firebase Auth simple, use Firestore for profile data
- **Benefits**: Easier profile management, richer data structure

### **Data Creation Timeline**
- **Signup**: Creates Firebase Auth user + Firestore profile with subscription data
  - Basic user data (name, email from signup)
  - Subscription details (plan, status, start date)
  - Subscription status (active, trial, etc.)
- **Login**: Validates credentials, no new data creation (user already exists)
- **Add Profile**: Adds lifestage to existing profile
- **Add Child Details**: Adds child information to profile

### **Onboarding Flow**
- **Purpose**: Collect essential user information
- **Steps**: Profile setup → Child details → Main app
- **State**: Tracked via Firestore `onboarded` field

## Security Considerations

### **Data Privacy**
- **User Isolation**: Each user can only access their own data
- **Email Verification**: Available but not currently enforced
- **Password Reset**: Available via Firebase Auth

### **Firestore Rules**
```typescript
// Users can only read/write their own profile
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Future Enhancements

### **Potential Additions**
- Email verification flow
- Password reset functionality
- Social login expansion (Apple, Facebook)
- Profile picture upload
- Multi-factor authentication
- Guest/anonymous user mode

## Current Limitations

### **Known Issues**
- No email verification requirement
- Limited social login options (only Google)
- No password reset UI
- No account deletion flow

### **Technical Debt**
- Signup name splitting could be improved
- Error handling could be more granular
- Loading states could be more consistent
