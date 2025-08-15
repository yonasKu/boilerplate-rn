# Apple Sign-In Setup Guide for SproutBook

This guide will walk you through setting up Apple Sign-In for your React Native/Expo app.

## Prerequisites

- Active Apple Developer Account ($99/year)
- Expo project with Expo Router
- Firebase project (optional but recommended)
- iOS device for testing (Apple Sign-In doesn't work on simulator)

## Step 1: Enable Apple Sign-In in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select **Identifiers**
4. Find your app's Bundle ID (e.g., `com.anonymous.SproutBook`)
5. Click on it and enable **Sign In with Apple**
6. Save the changes

## Step 2: Install Required Dependencies

```bash
# Install Apple Authentication package
expo install expo-apple-authentication

# Install secure storage for credential management
expo install expo-secure-store

# Install Firebase Auth (if using Firebase)
npm install firebase
```

## Step 3: Configure app.json

Add the required configuration to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.anonymous.SproutBook",
      "usesAppleSignIn": true,
      "entitlements": {
        "com.apple.developer.applesignin": ["Default"]
      }
    }
  }
}
```

## Step 4: Create Apple Sign-In Service

Create a new file: `src/features/auth/services/appleAuthService.ts`

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from '@/config/firebase';
import { signInWithCredential, OAuthProvider } from 'firebase/auth';

export class AppleAuthService {
  static async signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create Firebase credential
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.authorizationCode,
      });

      // Sign in with Firebase
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      return {
        success: true,
        user: userCredential.user,
        credential,
      };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'User cancelled' };
      }
      return { success: false, error: error.message };
    }
  }

  static async checkAppleSignInAvailability() {
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }
}
```

## Step 5: Create Apple Sign-In Button Component

Create a new component: `src/features/auth/components/AppleSignInButton.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';

interface AppleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({ 
  onPress, 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>Continue with Apple</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Step 6: Update LoginScreen to Include Apple Sign-In

Add the Apple Sign-In functionality to your LoginScreen:

```typescript
// In LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { AppleSignInButton } from '../components/AppleSignInButton';
import { AppleAuthService } from '../services/appleAuthService';

const LoginScreen = () => {
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);

  useEffect(() => {
    AppleAuthService.checkAppleSignInAvailability().then(setAppleSignInAvailable);
  }, []);

  const handleAppleSignIn = async () => {
    try {
      const result = await AppleAuthService.signInWithApple();
      if (result.success) {
        // Navigate to main app
        router.replace('/(main)/(tabs)/journal');
      } else {
        // Handle error
        console.error('Apple Sign-In failed:', result.error);
      }
    } catch (error) {
      console.error('Apple Sign-In error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Your existing login form */}
      
      {appleSignInAvailable && (
        <AppleSignInButton onPress={handleAppleSignIn} />
      )}
      
      {/* Rest of your login screen */}
    </SafeAreaView>
  );
};
```

## Step 7: Update SignUpScreen

Add similar Apple Sign-In functionality to your SignUpScreen:

```typescript
// Similar implementation as LoginScreen
```

## Step 8: Configure Firebase (if using)

1. Go to Firebase Console
2. Navigate to Authentication > Sign-in method
3. Enable **Apple** as a provider
4. Add your Apple Developer Team ID and Service ID

## Step 9: Test on iOS Device

1. Build for iOS:
```bash
npx expo run:ios
```

2. Test on a physical iOS device (Apple Sign-In doesn't work on simulator)

## Troubleshooting

### Common Issues:

1. **"Sign In with Apple not available"**
   - Ensure you're testing on iOS 13+ device
   - Check that Apple Sign-In is enabled in Apple Developer Portal

2. **"Invalid redirect URI"**
   - Configure OAuth redirect URLs in Firebase Console
   - Ensure bundle ID matches in app.json and Apple Developer Portal

3. **"Invalid client ID"**
   - Verify your bundle identifier is correct
   - Check that Service ID is properly configured

### Testing Checklist:

- [ ] Apple Sign-In enabled in Apple Developer Portal
- [ ] Bundle ID matches across all configurations
- [ ] Testing on iOS 13+ physical device
- [ ] Firebase Apple provider configured (if using Firebase)
- [ ] `expo-apple-authentication` package installed
- [ ] `app.json` configured with proper entitlements

## Security Considerations

- Apple Sign-In uses OAuth 2.0 flow
- User data is encrypted and secure
- No passwords stored - uses Apple ID tokens
- Follows Apple's privacy guidelines

## Next Steps

1. Test the implementation thoroughly
2. Add error handling for edge cases
3. Consider adding fallback options
4. Update your privacy policy to mention Apple Sign-In
5. Test on different iOS versions and devices

For additional help, refer to:
- [Expo Apple Authentication docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Apple Sign-In documentation](https://developer.apple.com/sign-in-with-apple/)
- [Firebase Apple Sign-In guide](https://firebase.google.com/docs/auth/ios/apple)
