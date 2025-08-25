# Complete Google Sign-In Setup Guide for SproutBook

This guide provides step-by-step instructions for setting up Google Sign-In in your Expo project using Firebase.

## 🔥 Part 1: Firebase Console Setup

1.  **Go to Firebase Console**
    -   Visit: https://console.firebase.google.com
    -   Select your SproutBook project (`sproutbook-d0c8f`).

2.  **Enable Google Sign-In**
    -   In the left menu, go to **Authentication** > **Sign-in method**.
    -   Click **Add new provider**.
    -   Select **Google** from the list.
    -   Click the **Enable** toggle.
    -   A **Project support email** will be required. Select your email from the dropdown.
    -   Click **Save**.

3.  **Download Configuration Files**
    -   Go to **Project Settings** (click the ⚙️ gear icon next to "Project Overview").
    -   Scroll down to the **Your apps** card.
    -   **For iOS**: If you haven't already, click **Add app**, select iOS, and register your app with the bundle ID `com.palex.sproutbook`. Download the `GoogleService-Info.plist` file and place it in the root of your project.
    -   **For Android**: Click **Add app**, select Android, and register your app with the package name `com.palex.sproutbook`. Download the `google-services.json` file and place it in the root of your project.

## ☁️ Part 2: Google Cloud Platform Configuration

Firebase automatically creates the necessary OAuth clients in your Google Cloud project, but you need to ensure they are configured correctly.

1.  **Get Your SHA-1 Fingerprint (for Android)**
    -   If you're building locally, run this command in your project directory:
        ```bash
        openssl rand -base64 32 | openssl sha1 -c -binary | openssl base64
        ```
    -   If you are using EAS Build, the easiest way is to let EAS manage it for you. Run `eas credentials` and follow the prompts. It will generate the necessary keystore and provide you with the SHA-1 hash. You can also find it in your Expo account under "Credentials".

2.  **Add SHA-1 to Firebase for Android**
    -   Go to **Project Settings** > **Your apps** in the Firebase console.
    -   Select your Android app.
    -   Click **Add fingerprint** and paste your SHA-1 certificate fingerprint.

3.  **Verify OAuth Consent Screen**
    -   Go directly to the **OAuth consent screen** for your project by clicking this link:
    [https://console.cloud.google.com/apis/credentials/consent?project=sproutbook-d0c8f](https://console.cloud.google.com/apis/credentials/consent?project=sproutbook-d0c8f)
    -   On the left-hand menu, click **Branding**. This is where you will configure your app name, support email, and logos.
    -   Ensure your app name, support email, and logos are configured.
    -   **Homepage URL & Privacy Policy URL:** These are **not strictly required for mobile-only apps**. You can leave them blank or use placeholder URLs if the form blocks you. If you need to add them, you can use your Firebase hosting URL as a placeholder (e.g., `https://sproutbook-d0c8f.web.app`).
    -   The **Publishing status** should be **In production** to avoid warnings for users. If it's "Testing", only users you've added as test users can log in.

## 🔧 Part 3: App Configuration

1.  **Install Dependencies**
    ```bash
    npx expo install @react-native-google-signin/google-signin
    ```

2.  **Configure `app.json`**
    -   You need to add the `expo-google-sign-in` plugin and your configuration files.

    ```json
    {
      "expo": {
        "name": "SproutBook",
        "slug": "SproutBook",
        "ios": {
          "bundleIdentifier": "com.palex.sproutbook",
          "googleServicesFile": "./GoogleService-Info.plist"
        },
        "android": {
          "package": "com.palex.sproutbook",
          "googleServicesFile": "./google-services.json"
        },
        "plugins": [
          "@react-native-google-signin/google-signin"
        ]
      }
    }
    ```

## 🧪 Part 4: Testing Google Sign-In

1.  **Rebuild Your App**
    -   After adding the plugin and config files, you must rebuild your development client.
    ```bash
    # For local development
    npx expo prebuild --clean
    npx expo run:ios
    npx expo run:android

    # For EAS
    eas build --profile development --platform all
    ```

2.  **Test Scenarios**
    -   **New User Sign-Up**: The user should be created in Firebase Authentication.
    -   **Existing User Login**: The user should be logged in successfully.
    -   **Onboarding Flow**: The app should correctly route the user based on their onboarding status.

## 📋 Part 5: Troubleshooting

-   **Error: `DEVELOPER_ERROR` (Android)**
    -   This almost always means your **SHA-1 fingerprint is incorrect or missing** in the Firebase settings for your Android app.
    -   Ensure the `package` name in `app.json` matches the one in Firebase.

-   **Error: `SIGN_IN_CANCELLED`**
    -   The user intentionally cancelled the flow. This is normal.

-   **Error on iOS**
    -   Ensure the `bundleIdentifier` in `app.json` matches the one in Firebase.
    -   Make sure the `GoogleService-Info.plist` file is correctly included in your build (Xcode).

-   **Web Client ID**
    -   The `@react-native-google-signin/google-signin` library requires a `webClientId` to be passed during initialization to get an `idToken` for Firebase. You can find this ID in your **Google Cloud Console** under **APIs & Services > Credentials**. It's the Client ID of the type "Web application".

Your Google Sign-In should now be ready for testing!
