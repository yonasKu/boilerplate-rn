# Firebase Troubleshooting Guide

This document explains how we solved two major Firebase errors during the setup of the SproutBook app.

---

## 1. Fixing `auth/configuration-not-found`

This was the first major error we encountered, which prevented users from authenticating.

### Problem
When trying to sign up or log in on Android, the app would immediately fail with a Firebase error `auth/configuration-not-found`.

### Cause
For Google Sign-In to work on Android, Firebase needs to verify the authenticity of your app. This is done using a unique digital signature called a **SHA-1 fingerprint**. This fingerprint was missing from the Firebase project's configuration.

### Solution
We followed the steps outlined in the `FIREBASE_SETUP.md` file:

1.  **Generated the SHA-1 Key:** We used the `./gradlew.bat signingReport` command inside the `android` directory to get the debug SHA-1 key.
2.  **Added SHA-1 to Firebase:** We pasted this key into the Android app settings in the Firebase Console.
3.  **Updated `google-services.json`:** After adding the key, we downloaded the new, updated `google-services.json` file and replaced the old one in the project.
4.  **Rebuilt the App:** We ran `npx expo run:android` to apply the new native configuration.

This fixed the authentication issue and allowed users to sign in successfully.

---

## 2. Fixing `permission-denied`

Immediately after fixing the first error, a new one appeared right after a user would sign up.

### Problem
After a user successfully authenticated, the app would fail with a Firebase error `permission-denied` when trying to create the user's profile in the database.

### Cause
By default, your Firestore database is locked down. The default security rules deny all reads and writes from anyone. Your app was trying to write a new user profile to the `users` collection, but the rules were blocking it.

### Solution
We needed to create and deploy new security rules that allow authenticated users to create and manage their own data.

1.  **Create Security Rules:** We defined the following rules in the `firestore.rules` file. This rule states that a user can only read or write to a document in the `/users/` collection if their authenticated `uid` matches the document's ID (`userId`).

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow users to read and write their own user document.
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```

2.  **Deploy the Rules Manually:** We deployed these rules by copying the text above and pasting it directly into the Firebase Console.
    *   **Location:** Firebase Console -> Firestore Database -> Rules tab.
    *   **Action:** Replaced the default rules, then clicked **Publish**.

This immediately fixed the permission error, allowing the app to function as expected.
