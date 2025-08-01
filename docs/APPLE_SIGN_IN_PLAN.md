## Apple Sign-In Implementation Plan

This document outlines the steps to integrate native Apple Sign-In into the SproutBook app.

### Part 1: Implementation

- [ ] **Install Dependency:** Install the official Expo package for Apple Authentication.
  ```bash
  npx expo install expo-apple-authentication
  ```
- [ ] **Implement Apple Sign-In Logic:** Create a new function in `src/lib/firebase/auth.ts` to handle the native Apple Sign-In flow. This will involve:
    - Using `* as AppleAuthentication` to get the credential from the user.
    - Creating an `OAuthProvider` for Apple.
    - Signing into Firebase with the credential.
    - Creating a new user profile in Firestore if the user is new.
- [ ] **Connect to UI:** Connect the new Apple Sign-In function to the button in `LoginScreen.tsx` and `SignUpScreen.tsx`.
    - The button should only be visible on iOS devices. We will use `Platform.OS === 'ios'` to control its visibility.

### Part 2: Configuration & Testing

- [ ] **Configure Apple Developer Account:** This step must be done manually in the Apple Developer portal. It involves setting up an App ID, a Service ID, and a private key.
- [ ] **Run Prebuild:** Generate/update the native `android` and `ios` folders.
  ```bash
  npx expo prebuild --clean
  ```
- [ ] **Build and Run on an iOS Device/Simulator:** Use the development client to test the feature.
  ```bash
  npx expo run:ios
  ```
- [ ] **Test Apple Sign-In Flow:**
    - [ ] Test on a physical iOS device.
    - [ ] Verify new user creation.
    - [ ] Verify existing user login.
