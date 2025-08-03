# Email Verification & Password Reset Implementation Plan

## Current Status
- ✅ Navigation flow fixed and working correctly
- ✅ Real data fetching from Firebase implemented  
- ✅ Date formatting issues resolved
- ❌ No email verification at signup
- ❌ No forgot password functionality

## Professional Implementation Strategy

### Phase 1: Firebase Configuration (Simplified)
**Priority: CRITICAL - Just 2 minutes**

#### 1.1 Enable Email Verification in Firebase Console
1. Go to Firebase Console → Authentication → Templates
2. **Just toggle ON** Email Verification template (uses Firebase defaults)
3. **Done!** No custom URLs or domains needed

#### 1.2 Enable Password Reset in Firebase Console
1. Go to Firebase Console → Authentication → Templates  
2. **Just toggle ON** Password Reset template (uses Firebase defaults)
3. **Done!** Works immediately

#### 1.3 Skip Custom Configuration
- No custom domains needed
- No deep linking setup required
- Firebase handles all URLs automatically

### Phase 2: Email Verification Flow
**Priority: HIGH**

#### 2.1 Backend Service Updates
**File: `src/lib/firebase/auth.ts`**

```typescript
// Enhanced signup with Firebase's built-in verification
export const signUpWithEmail = async (email, password, firstName, lastName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Simple Firebase verification - no custom URL needed
  await sendEmailVerification(user);
  
  // Create user profile with verification status
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    name: `${firstName} ${lastName}`,
    subscription: {
      plan: 'basic',
      status: 'trial',
      startDate: new Date(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    lifestage: null,
    children: [],
    createdAt: new Date(),
    onboarded: false,
    emailVerified: false, // Track verification status
  });
  
  await auth.signOut(); // Force login after verification
  return userCredential;
};

// New verification functions
export const sendVerificationEmail = async (user) => {
  await sendEmailVerification(user);
};

export const checkEmailVerified = async (user) => {
  await user.reload(); // Refresh user data
  return user.emailVerified;
};
```

#### 2.2 New Verification Screen
**File: `src/app/(auth)/verify-email.tsx`**

```typescript
// Simple verification screen - no deep linking needed
// Features:
// - "Check your email" message
// - Resend verification button
// - "I've verified" button to check status
// - Continue to login after verification
```

#### 2.3 Signup Flow Updates
**File: `src/features/auth/screens/SignUpScreen.tsx`**

```typescript
// Update handleSignUp to show verification message
const handleSignUp = async () => {
  try {
    await signUpWithEmail(email, password, firstName, lastName);
    // Show verification screen instead of pricing
    router.replace('/(auth)/verify-email');
  } catch (error) {
    // Handle errors appropriately
  }
};
```

### Phase 3: Simple Configuration (Skip Deep Linking)
**Priority: LOW - Skip for now**

Firebase's built-in verification works without any custom configuration:
- Uses Firebase's default URLs
- Works on mobile and web automatically
- No custom domains or deep linking required

Skip this phase entirely - Firebase handles everything automatically.

### Phase 4: Simple Security Rules
**Priority: MEDIUM**

#### 4.1 Basic Firestore Rules (No verification requirement initially)
```javascript
// Start with basic rules - add verification requirement later
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId;
}

// Children collection
match /children/{childId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.parentId;
  allow create: if request.auth != null && request.resource.data.parentId == request.auth.uid;
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.parentId;
}
```

### Phase 5: Enhanced Security Rules
**Priority: HIGH**

#### 5.1 Updated Firestore Rules
```javascript
// Require email verification for sensitive operations
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && 
    request.auth.uid == userId && 
    request.auth.token.email_verified == true;
  allow update: if request.auth != null && 
    request.auth.uid == userId;
}

// Children collection with verification check
match /children/{childId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.parentId &&
    request.auth.token.email_verified == true;
  allow create: if request.auth != null && 
    request.resource.data.parentId == request.auth.uid &&
    request.auth.token.email_verified == true;
}
```

### Phase 6: User Experience Enhancements
**Priority: MEDIUM**

#### 6.1 Email Templates
- **Verification Email**: Welcome message with clear CTA
- **Password Reset**: Secure reset instructions
- **Branding**: Consistent with app design

#### 6.2 Error Handling
- Clear error messages for common scenarios
- Retry mechanisms for failed email delivery
- Graceful fallback options

#### 6.3 Loading States
- Proper loading indicators during email sending
- Success confirmations after actions
- Clear navigation flow

## Implementation Timeline

### Week 1: Foundation
- [ ] Firebase console configuration
- [ ] Update security rules
- [ ] Add email verification to signup

### Week 2: UI Implementation
- [ ] Create verification screen
- [ ] Create forgot password screen
- [ ] Update login screen with forgot password link

### Week 3: Deep Linking & Testing
- [ ] Configure deep linking
- [ ] Test email flows end-to-end
- [ ] Handle edge cases and error scenarios

### Week 4: Polish & Deployment
- [ ] Custom email templates
- [ ] Final testing across devices
- [ ] Production deployment

## Technical Considerations

### Security Best Practices
- Rate limiting for email sending
- Secure token handling
- HTTPS enforcement
- Input validation and sanitization

### User Experience
- Clear instructions at each step
- Mobile-responsive email templates
- One-click verification from mobile
- Seamless transition back to app

### Monitoring & Analytics
- Track email delivery rates
- Monitor verification completion rates
- Password reset success metrics
- User feedback collection

## Success Metrics
- Email verification completion rate > 85%
- Password reset success rate > 90%
- Reduced fake account creation
- Improved user trust and engagement

This plan provides a comprehensive, production-ready implementation following Firebase best practices and modern security standards.
