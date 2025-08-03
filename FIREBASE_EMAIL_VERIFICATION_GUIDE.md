# Firebase Email Verification & Password Reset - Simple Implementation

## Quick Start (5 Minutes Total)

### Step 1: Firebase Console Setup (2 minutes)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Authentication → Templates
3. **Toggle ON** Email Verification template
4. **Toggle ON** Password Reset template
5. **Done!** No other configuration needed

### Step 2: Code Changes (3 minutes)

#### Add Email Verification to Signup
**File: `src/lib/firebase/auth.ts`**
```typescript
// Add this import
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';

// Update signup function
export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Send verification email (1 line)
  await sendEmailVerification(user);
  
  // Create user profile
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
    emailVerified: false,
  });
  
  await auth.signOut();
  return userCredential;
};

// Add password reset function
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};
```

### Step 3: Update Signup Flow
**File: `src/features/auth/screens/SignUpScreen.tsx`**
```typescript
const handleSignUp = async () => {
  try {
    await signUpWithEmail(email, password, firstName, lastName);
    // Show verification message instead of pricing
    Alert.alert(
      'Verification Email Sent',
      'Please check your email and verify your account before logging in.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
  } catch (error) {
    // Handle errors
  }
};
```

### Step 4: Add Forgot Password to Login
**File: `src/features/auth/screens/LoginScreen.tsx`**
```typescript
// Add forgot password handler
const handleForgotPassword = async () => {
  Alert.prompt(
    'Reset Password',
    'Enter your email address:',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Send Reset Email', 
        onPress: async (email) => {
          if (email) {
            try {
              await resetPassword(email);
              Alert.alert('Success', 'Password reset email sent!');
            } catch (error) {
              Alert.alert('Error', 'Failed to send reset email');
            }
          }
        }
      }
    ],
    'plain-text'
  );
};

// Add forgot password link in UI
<TouchableOpacity onPress={handleForgotPassword}>
  <Text style={styles.forgotPassword}>Forgot Password?</Text>
</TouchableOpacity>
```

## How It Works (No Backend Service Needed)

### Email Verification Flow:
1. User signs up → Firebase sends verification email automatically
2. User clicks link in email → Email gets verified
3. User logs in → You can check `user.emailVerified`
4. **All handled by Firebase - no custom backend needed**

### Password Reset Flow:
1. User clicks "Forgot Password" → Enters email
2. Firebase sends reset email automatically  
3. User clicks link → Sets new password
4. User logs in with new password
5. **All handled by Firebase - no custom backend needed**

## Testing the Flow

### Email Verification Test:
1. Sign up with new email
2. Check email for verification link
3. Click link → should show "email verified"
4. Try to login → should work

### Password Reset Test:
1. Go to login screen
2. Click "Forgot Password"
3. Enter email → check for reset email
4. Click reset link → set new password
5. Login with new password → should work

## Common Issues & Solutions

### Issue: "Email not sending"
- **Solution**: Check Firebase Console → Authentication → Users → ensure email isn't blocked

### Issue: "Verification link not working"
- **Solution**: Ensure user clicks link in same browser/device where they signed up

### Issue: "Password reset email in spam"
- **Solution**: Ask users to check spam folder and add noreply@firebaseapp.com to contacts

## No Backend Service Required

**Everything is handled by Firebase's built-in services:**
- ✅ Email sending via Firebase
- ✅ Link generation via Firebase  
- ✅ Verification via Firebase
- ✅ Password reset via Firebase
- ✅ Security via Firebase Auth

**No external services needed!**
