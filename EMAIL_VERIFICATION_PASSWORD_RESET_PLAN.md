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

## Implementation Approaches

### **Option A: Firebase Built-in Email Verification (RECOMMENDED)**
**Timeline: 1-2 days**
- [ ] Enable email verification in Firebase Console (2 minutes)
- [ ] Add single line: `await sendEmailVerification(user)`
- [ ] Create simple verification screen
- [ ] Test end-to-end flow

### **Option B: OTP-Based Email Verification (Alternative)**
**Timeline: 3-4 days**
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Generate 6-digit OTP codes
- [ ] Create OTP input screen
- [ ] Implement code validation logic
- [ ] Add resend OTP functionality

### **Option C: Firebase Password Reset (Built-in)**
**Timeline: 1 day**
- [ ] Enable password reset in Firebase Console (2 minutes)
- [ ] Add single line: `await sendPasswordResetEmail(auth, email)`
- [ ] Create forgot password screen
- [ ] Test end-to-end flow

## OTP-Based Email Verification (Alternative Approach)

### **Backend Service for OTP**
**File: `src/lib/email/otpService.ts`**

```typescript
import { generateOTP, sendOTPEmail, validateOTP } from '@/lib/email/otpService';

// Generate and send OTP
export const sendEmailOTP = async (email: string, userId: string) => {
  const otp = generateOTP(6); // 6-digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Store OTP in Firestore
  await setDoc(doc(db, 'emailVerifications', userId), {
    email,
    otp,
    expiresAt,
    attempts: 0,
    used: false
  });
  
  // Send OTP via email
  await sendOTPEmail(email, otp);
};

// Validate OTP
export const verifyEmailOTP = async (userId: string, otp: string) => {
  const verificationDoc = await getDoc(doc(db, 'emailVerifications', userId));
  
  if (!verificationDoc.exists()) {
    throw new Error('OTP not found');
  }
  
  const data = verificationDoc.data();
  
  if (data.used) {
    throw new Error('OTP already used');
  }
  
  if (new Date() > data.expiresAt.toDate()) {
    throw new Error('OTP expired');
  }
  
  if (data.otp !== otp) {
    // Increment attempts
    await updateDoc(doc(db, 'emailVerifications', userId), {
      attempts: increment(1)
    });
    throw new Error('Invalid OTP');
  }
  
  // Mark as used
  await updateDoc(doc(db, 'emailVerifications', userId), {
    used: true
  });
  
  return true;
};
```

### **OTP Email Service**
**File: `src/lib/email/emailService.ts`**

```typescript
// Using SendGrid (free tier available)
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOTPEmail = async (email: string, otp: string) => {
  const msg = {
    to: email,
    from: 'noreply@sproutbook.app',
    subject: 'Your SproutBook Verification Code',
    html: `
      <h2>Verify Your Email</h2>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
      <p>Enter this code in the app to complete your registration.</p>
    `
  };
  
  await sgMail.send(msg);
};
```

### **OTP Verification Screen**
**File: `src/app/(auth)/verify-otp.tsx`**

```typescript
// 6-digit OTP input screen
// Features:
// - 6 separate input boxes
// - Auto-focus between boxes
// - Resend OTP button (30-second cooldown)
// - Error handling for invalid/expired codes
// - Continue to app after successful verification
```

### **Signup Flow with OTP**
**File: `src/features/auth/screens/SignUpScreen.tsx`**

```typescript
const handleSignUp = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send OTP instead of standard verification
    await sendEmailOTP(email, user.uid);
    
    // Navigate to OTP verification screen
    router.replace('/(auth)/verify-otp');
  } catch (error) {
    // Handle errors
  }
};
```

### **OTP Security Features**
- **6-digit codes** (100000-999999)
- **10-minute expiration**
- **Maximum 3 attempts**
- **Rate limiting** (1 OTP per minute)
- **One-time use only**
- **Secure storage** in Firestore

### **Firebase Rules for OTP**
```javascript
// Add OTP verification collection
match /emailVerifications/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId;
}
```

## Comparison: Firebase vs OTP

| Feature | Firebase Built-in | OTP Custom |
|---------|-------------------|------------|
| **Setup Time** | 2 minutes | 1-2 hours |
| **Code Required** | 1 line | 50+ lines |
| **Security** | Enterprise-grade | Good |
| **Cost** | Free | SendGrid/AWS costs |
| **User Experience** | One-click | Manual code entry |
| **Mobile Support** | Perfect | Perfect |
| **Branding** | Firebase branding | Full custom |

## Recommendation

**Start with Firebase Built-in (Option A)** for immediate implementation, then consider **OTP (Option B)** later if you need:
- Custom branded emails
- More control over verification flow
- Specific business requirements

Both approaches are production-ready and secure!

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
