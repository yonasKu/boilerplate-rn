# Complete Apple Sign-In Setup Guide for SproutBook

This guide provides step-by-step instructions for setting up Apple Sign-In from Apple Developer Portal through Firebase configuration.

## 🍎 Part 1: Apple Developer Portal Setup

### Step 1: Enable Apple Sign-In in Apple Developer Portal

1. **Go to Apple Developer Portal**
   - Visit: https://developer.apple.com/account/
   - Sign in with your Apple ID

2. **Navigate to Certificates, Identifiers & Profiles**
   - Click on **Identifiers**
   - Find your app's Bundle ID (e.g., `com.anonymous.SproutBook`)
   - Click on your Bundle ID

3. **Enable Sign In with Apple**
   - Scroll down to **Capabilities**
   - Check **Sign In with Apple**
   - A **Configure** button will appear. Click it.
   - **Configure Email Communication**: You must register the email addresses or domains your app will use to communicate with users. Add any emails you use for support or notifications (e.g., `support@sproutbook.app`). This is required for Apple's private email relay service to work.
   - Click **Save**

### Step 2: Create a Service ID (for Firebase)

**Why a second identifier?** This is a common point of confusion. You are creating two *different types* of identifiers for two different jobs:
- **App ID (Step 1):** Identifies your actual app on the user's phone.
- **Service ID (This Step):** Identifies your backend service (Firebase) that will verify the user's login with Apple's servers.

You need both for the system to work securely.

This is a common point of confusion as Apple has updated its layout. A Service ID is now a *type* of Identifier.

1. Go to **Certificates, Identifiers & Profiles** > **Identifiers**.
2. Click the blue **(+)** button next to the "Identifiers" title to register a new identifier.
3. From the list of options, select **Service IDs** and click **Continue**.
4. Now you can configure the Service ID:
   - **Description**: `SproutBook Apple Sign-In`
   - **Identifier**: `com.anonymous.SproutBook.signin` (or your bundle ID + `.signin`)
   - **Enable Sign In with Apple**
   - **Primary App ID**: Select your main app bundle ID
   - **Domains and Subdomains**: (Optional) Add your domain if you have one. For mobile-only apps using Firebase, you can leave this blank.
   - **Troubleshooting**: If the 'Next' or 'Continue' button is disabled, try adding your Firebase project's domain here: `sproutbook-d0c8f.firebaseapp.com`. This is a UI quirk and this value is not used for the mobile sign-in.
   - **Return URLs**: Add `https://sproutbook-d0c8f.firebaseapp.com/__/auth/handler` (This uses your specific project ID).

5. **Click Continue → Register**

### Step 3: Create Private Key

1. **Go to Certificates, Identifiers & Profiles**
2. **Click on Keys**
3. **Click the "+" button**
4. **Configure Key:**
   - **Key Name**: `SproutBook Apple Sign-In Key`
   - **Enable Sign In with Apple**
   - **App IDs**: Select your main app
5. **Click Continue → Register**
6. **Download the .p8 file** - Save this securely, you'll need it for Firebase

## 🔥 Part 2: Firebase Configuration

### Step 1: Enable Apple Provider in Firebase

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your SproutBook project

2. **Enable Apple Sign-In**
   - Go to **Authentication** → **Sign-in method**
   - Click **Add new provider**
   - Select **Apple**
   - Click **Enable**

### Step 2: Configure Apple Provider

1. **Service ID**: Enter your Service ID from Step 2 (e.g., `com.anonymous.SproutBook.signin`)
2. **Apple Team ID**: Find this in Apple Developer Portal → Membership
3. **Key ID**: From your .p8 file (filename contains the key ID)
4. **Private Key**: Upload the .p8 file you downloaded
5. **Click Save**

### Step 3: Configure OAuth Redirect URI

1. **Copy the OAuth redirect URI** from Firebase:
   - It will look like: `https://sproutbook-[your-project-id].firebaseapp.com/__/auth/handler`

2. **Add this to your Service ID in Apple Developer Portal**
   - Go back to your Service ID
   - Add the Firebase redirect URI to **Return URLs**

## 🔧 Part 3: App Configuration


### Step 1: Update app.json

```json
// This is an example of the required configuration.
// Your actual app.json will have more fields.
{
  "expo": {
    // ... other expo config
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.SproutBook",
      "googleServicesFile": "./GoogleService-Info.plist", // For Google Sign-In
      "usesAppleSignIn": true, // For Apple Sign-In
      "entitlements": {
        "com.apple.developer.applesignin": ["Default"]
      }
    },
    "android": {
      // ... other android config
      "package": "com.anonymous.SproutBook",
      "googleServicesFile": "./google-services.json" // For Google Sign-In
    },
    "plugins": [
      // ... other plugins
      "@react-native-google-signin/google-signin" // For Google Sign-In
    ]
  }
}
```

### Step 2: Install Dependencies

```bash
npm install expo-apple-authentication
```

### Step 3: Update Firebase Rules (Optional)

If you want to enforce email verification:

```javascript
// In Firebase Authentication rules
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid && auth.token.email_verified === true"
      }
    }
  }
}
```

## 🧪 Part 4: Testing Apple Sign-In

### Step 1: Build for iOS

```bash
# Build for iOS device
expo run:ios --device

# Or build with EAS
eas build --platform ios
```

### Step 2: Test Scenarios

1. **New User Sign-Up**
   - Use Apple Sign-In as new user
   - Should go through onboarding flow

2. **Existing User Login**
   - Use Apple Sign-In as existing user
   - Should skip to main app

3. **Error Handling**
   - Test cancellation
   - Test network failures

## 📋 Part 5: Troubleshooting

### Common Issues & Solutions

1. **"Configuration not found"**
   - Ensure Firebase project is properly linked
   - Check GoogleService-Info.plist is in project root

2. **"Invalid client"**
   - Verify Service ID matches Firebase configuration
   - Check Team ID is correct

3. **"Invalid redirect URI"**
   - Ensure Firebase redirect URI is added to Service ID
   - Check for typos in URLs

4. **"Apple Sign-In not available"**
   - Test on real iOS device (not simulator)
   - Ensure Apple Developer account is active
   - Check bundle ID matches

### Debug Commands

```bash
# Check if Apple Sign-In is available
expo run:ios --device

# View logs
expo logs --ios

# Test specific flow
expo run:ios --device --configuration Debug
```

## ✅ Verification Checklist

- [ ] Apple Sign-In enabled in Apple Developer Portal
- [ ] Service ID created and configured
- [ ] Private key (.p8) downloaded and saved
- [ ] Firebase Apple provider configured
- [ ] OAuth redirect URI added to Service ID
- [ ] app.json updated with bundle identifier
- [ ] Dependencies installed
- [ ] Tested on real iOS device
- [ ] Both sign-up and login flows working
- [ ] Onboarding flow triggered correctly

## 📞 Support Resources

- **Apple Developer Documentation**: https://developer.apple.com/documentation/sign_in_with_apple
- **Firebase Apple Auth**: https://firebase.google.com/docs/auth/ios/apple
- **Expo Apple Authentication**: https://docs.expo.dev/versions/latest/sdk/apple-authentication/

## 🚨 Important Notes

1. **Apple Developer Account**: $99/year required
2. **Real iOS Device**: Required for testing (simulator doesn't work)
3. **Bundle ID**: Must match exactly across Apple Developer Portal and Firebase
4. **Service ID**: Separate from main app bundle ID
5. **Private Key**: Keep secure - treat like password

## 🎯 Next Steps

1. Complete Apple Developer Portal setup
2. Configure Firebase Apple provider
3. Test on real iOS device
4. Verify both sign-up and login flows
5. Test onboarding flow triggers correctly

Your Apple Sign-In is now ready for testing!
