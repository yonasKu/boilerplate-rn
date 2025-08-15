# How to Get Your Google Sign-In Client IDs

This guide provides a complete walkthrough for setting up your Google Cloud project to get the necessary credentials for Google Sign-In.

## Part 1: Configure the OAuth Consent Screen

Before you can create client IDs, you must tell Google about your app by configuring the consent screen. This is the screen users will see when they sign in with Google.

1.  **Start Configuration**: Go to the [Credentials page](https://console.cloud.google.com/apis/credentials). At the top, you will see a warning that says "Remember to configure the OAuth consent screen". Click the **Configure consent screen** button.
2.  **User Type**: Choose **External** and click **Create**.
3.  **App Information**:
    *   **App name**: `SproutBook`
    *   **User support email**: Select your email from the dropdown.
    *   **Developer contact information**: Enter your email address at the bottom.
    *   Click **SAVE AND CONTINUE**.
4.  **Scopes**: You don't need to add any scopes for basic sign-in. Click **SAVE AND CONTINUE**.
5.  **Test Users**: You can also skip this for now. Click **SAVE AND CONTINUE**.
6.  **Summary**: Review the summary and click **BACK TO DASHBOARD**.

## Part 2: Create the Client IDs

Now that the consent screen is configured, you can create the three client IDs your app needs.

1.  Navigate back to the [Credentials page](https://console.cloud.google.com/apis/credentials).
2.  Click **+ CREATE CREDENTIALS** at the top of the page and select **OAuth client ID**.

### Create the Web Client ID

This is used for web and sometimes as a fallback.

1.  **Application type**: Select **Web application**.
2.  **Name**: You can leave it as `Web client 1`.
3.  Click **CREATE**.
4.  A window will pop up with your client ID. Copy it and save it somewhere safe. You will add it to your `.env` file later.

### Create the Android Client ID

This is required for the native Android app.

1.  Click **+ CREATE CREDENTIALS** again and select **OAuth client ID**.
2.  **Application type**: Select **Android**.
3.  **Package name**: `com.anonymous.SproutBook` (This must exactly match the `package` name in your `app.json` file).
4.  **SHA-1 certificate fingerprint**: This is the most complex part. For development, you need the SHA-1 fingerprint from your debug keystore. Open a terminal or command prompt on your computer and run this command:
    ```bash
    keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
    ```
    Copy the `SHA1` value from the output.
5.  Paste the SHA-1 value into the form and click **CREATE**.
6.  Copy the Android Client ID and save it.



### Create the iOS Client ID

This is required for the native iOS app.

1.  Click **+ CREATE CREDENTIALS** again and select **OAuth client ID**.
2.  **Application type**: Select **iOS**.
3.  **Bundle ID**: `com.anonymous.SproutBook` (You should add this to your `app.json` under the `ios` key as `bundleIdentifier`).
4.  Click **CREATE**.
5.  Copy the iOS Client ID and save it.

## Part 3: Add the Client IDs to Your `.env` File

1.  Open the `.env` file in your project.
2.  Add the three client IDs you just created.

```env
# Google Sign-In Client IDs
EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID="PASTE_YOUR_WEB_CLIENT_ID_HERE"
EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID="PASTE_YOUR_ANDROID_CLIENT_ID_HERE"
EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID="PASTE_YOUR_IOS_CLIENT_ID_HERE"
```

## Part 4: Restart Your Application

This is a very important step. Your application will not see the new environment variables until you restart it.

1.  Go to the terminal where your Expo app is running.
2.  Press `Ctrl+C` to stop the server.
3.  Run `npx expo run:android` again to restart it.
