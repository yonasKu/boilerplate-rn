# Next Steps: Social Authentication Implementation

This document outlines the detailed plan for implementing Google and Apple Sign-In.

---

### **IMPORTANT: Switching to a Development Client**

To use native Google and Apple Sign-In, you need to add native configuration files (`google-services.json` and `GoogleService-Info.plist`). This requires moving from the standard Expo Go app to a **custom development client**.

**This is a one-time setup process.**

1.  **Install Development Client:** Add the library needed to build your custom client.
    ```bash
    npx expo install expo-dev-client
    ```

2.  **Add Firebase Configuration Files:** Before you prebuild, you must add your native configuration files to the project. Follow the steps in the "Google Sign-In" section below to download your `google-services.json` and `GoogleService-Info.plist` files and place them in the root directory.

3.  **Prebuild Your Project:** Now that the config files are in place, this command will generate the native `ios` and `android` directories and correctly link Firebase.
    ```bash
    npx expo prebuild
    ```
    *If you have already run prebuild, it is safe to run it again to sync the new configuration files.*

4.  **Start Your Development Build:** Instead of `expo start`, you will now run your app on a simulator or physical device using a development build. For example:
    ```bash
    npx expo run:ios
    # or
    npx expo run:android
    ```

From this point forward, you will use the `run:ios` or `run:android` commands to develop your app. The rest of the plan assumes you have completed this setup.

---

### 1. Google Sign-In (for iOS & Android)

**Objective:** Allow users to sign up and log in using their Google account.

**Steps:**

1.  **Install Dependencies:**
    *   Run the following command to install the required Expo libraries for handling the native authentication flow:
    ```bash
    npx expo install expo-auth-session expo-crypto expo-web-browser @react-native-google-signin/google-signin
    ```

2.  **Configure Firebase for Native Auth:**
    *   To get the necessary client IDs, you must add native app configurations to your Firebase project.
    *   **Note:** You are only downloading small configuration files (`.json` and `.plist`), not the full native SDKs. The `prebuild` command handles the actual SDK integration for you.
    *   **For Android:**
        *   Go to Firebase Console -> Project Settings -> Add app -> Select Android.
        *   Follow the instructions to register your app. You will need your app's package name (found in `app.json`).
        *   Download the `google-services.json` file and place it in the root of your project.
    *   **For iOS:**
        *   Go to Firebase Console -> Project Settings -> Add app -> Select iOS.
        *   Follow the instructions to register your app. You will need your app's bundle identifier (found in `app.json`).
        *   Download the `GoogleService-Info.plist` file and place it in the root of your project.

3.  **Add Client IDs to Environment:**
    *   Open your `.env` file and add the client IDs obtained from the configuration files:
    ```env
    EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID="YOUR_WEB_CLIENT_ID_FROM_FIREBASE_SETTINGS"
    EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID="YOUR_IOS_CLIENT_ID_FROM_GoogleService-Info.plist"
    ```

4.  **Update Firebase Auth Logic:**
    *   Modify the `signInWithGoogle` function in `src/lib/firebase/auth.ts` to use `expo-auth-session` to handle the native Google Sign-In flow.

5.  **Connect to UI:**
    *   Update the "Sign in with Google" buttons in `LoginScreen.tsx` and `SignUpScreen.tsx` to call the new `signInWithGoogle` function.

---

### 2. Apple Sign-In (for iOS)

**Objective:** Allow users on iOS devices to sign up and log in using their Apple ID.

**Steps:**

1.  **Install Dependencies:**
    *   Run the following command to install the required Expo library for Apple Authentication:
    ```bash
    npx expo install expo-apple-authentication
    ```

2.  **Configure Apple Developer & Firebase:**
    *   In the Firebase Console, ensure the Apple provider is enabled under Authentication -> Sign-in method.
    *   In your Apple Developer account, you will need to configure a Service ID with "Sign in with Apple" enabled.
    *   You must also ensure your app's Bundle Identifier is correctly set up in both your Expo project (`app.json`) and your Firebase project settings.

3.  **Update Firebase Auth Logic:**
    *   Add a new `signInWithApple` function to `src/lib/firebase/auth.ts`. This function will use the `expo-apple-authentication` library to handle the native sign-in flow and then pass the resulting credential to Firebase.

4.  **Connect to UI:**
    *   Update the "Sign in with Apple" buttons in `LoginScreen.tsx` and `SignUpScreen.tsx` to call the new `signInWithApple` function.
    *   Ensure the Apple Sign-In button is only visible on iOS devices, as it is not supported on Android.
