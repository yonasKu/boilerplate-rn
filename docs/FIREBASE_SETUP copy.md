# Firebase Authentication Setup Guide for SproutBook

This guide will walk you through the necessary steps to correctly configure Firebase Authentication in your Firebase project console. This is a critical step to fix the `auth/configuration-not-found` error.

---

### Part 1: Enable Sign-In Providers

You must enable the authentication methods you want to use in your app.

1.  **Go to the Firebase Authentication Providers page:**
    *   Click this link: [https://console.firebase.google.com/project/sproutbook-8ea5c/authentication/providers](https://console.firebase.google.com/project/sproutbook-8ea5c/authentication/providers)

2.  **Enable Email/Password Sign-In:**
    *   In the list, find and click on **Email/Password**.
    *   Click the **Enable** toggle switch.
    *   Click **Save**.

3.  **Enable Google Sign-In:**
    *   In the list, find and click on **Google**.
    *   Click the **Enable** toggle switch.
    *   Select your **Project support email** from the dropdown menu.
    *   Click **Save**.

---

### Part 2: Add SHA-1 Fingerprint for Android

For Google Sign-In to work securely on Android, Firebase needs to know your app's unique digital signature (the SHA-1 fingerprint). This is the most likely missing piece.

1.  **Open a terminal or command prompt** in your project's root directory (`c:\Users\HP\CascadeProjects\SproutBook`).

2.  **Run the following command to generate the signature report:**
    ```bash
    cd android && .\gradlew.bat signingReport
    ```

3.  **Find your SHA-1 Key:**
    *   In the output of the command, scroll up until you find the section for the `debug` variant. It will look something like this:
    ```
    > Task :app:signingReport
    Variant: debug
    Config: debug
    Store: C:\Users\HP\.android\debug.keystore
    Alias: AndroidDebugKey
    MD5: ...
    SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
    SHA-256: ...
    Valid until: ...
    ```
    *   Copy the **SHA1** value (the long string of hexadecimal numbers).

4.  **Add the SHA-1 Key to Firebase:**
    *   Go to your Firebase Project Settings: [https://console.firebase.google.com/project/sproutbook-8ea5c/settings/general/android:com.palex.sproutbook](https://console.firebase.google.com/project/sproutbook-8ea5c/settings/general/android:com.palex.sproutbook)
    *   Scroll down to the "Your apps" card and find your Android app.
    *   Click on **Add fingerprint**.
    *   Paste the **SHA-1** key you copied into the "SHA certificate fingerprint" field.
    *   Click **Save**.

---

### Part 3: Update `google-services.json`

After adding the SHA-1 fingerprint, your configuration file has changed. You need to download the new version.

1.  In the same Firebase Project Settings page, click the **`google-services.json`** button to download the updated file.
2.  Replace the old `google-services.json` file located at `c:\Users\HP\CascadeProjects\SproutBook\android\app\google-services.json` with the new one you just downloaded.

---

### Part 4: Rebuild and Run the App

To make sure all the new native configurations are applied, you need to rebuild your app.

1.  Run the following command in your terminal:
    ```bash
    npx expo run:android
    ```

After completing these steps, the authentication error should be resolved. Please try signing up again.
