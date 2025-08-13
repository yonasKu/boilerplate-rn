# Push Notifications Setup Guide (V2 - Modern & Secure)

## SproutBook - Expo + Firebase (Admin SDK Method)

This guide provides the up-to-date, secure, and Google-recommended method for setting up push notifications in an Expo application using Firebase. It replaces the outdated legacy "AAAA..." server key method with the Firebase Admin SDK and a secure service account.

---

### **Core Concept: Why This Method is Better**

-   **Security**: Instead of a single, powerful server key, we use a **Service Account**. This provides granular, revocable permissions for your backend services, which is much more secure.
-   **Maintainability**: The Firebase Admin SDK is the official, modern way to interact with Firebase services from a backend. It is actively maintained and supported by Google.
-   **Simplicity**: Once set up, you no longer need to hunt for hidden legacy keys in the Firebase console. The configuration is explicit and clear.

---

### **Step 1: Generate a Firebase Service Account Key**

This is the most critical step and replaces the need for the old server key.

1.  **Go to the Google Cloud Console**: Navigate to your project's service accounts page:
    `https://console.cloud.google.com/iam-admin/serviceaccounts?project=[YOUR_FIREBASE_PROJECT_ID]`
    *(Replace `[YOUR_FIREBASE_PROJECT_ID]` with your actual Firebase project ID)*.

2.  **Select Your Project**: Ensure the correct project is selected in the top navigation bar.

3.  **Create Service Account**:
    *   Click **+ CREATE SERVICE ACCOUNT**.
    *   **Service account name**: `firebase-push-notifications` (or a name you prefer).
    *   **Role**: Select **Firebase Admin SDK Administrator Service Agent** to grant it the necessary permissions.
    *   Click **DONE**.

4.  **Generate a JSON Key**:
    *   Find the newly created service account in the list.
    *   Click the **three-dot menu (⋮)** under "Actions" and select **Manage keys**.
    *   Click **ADD KEY** -> **Create new key**.
    *   Choose **JSON** as the key type and click **CREATE**.

5.  **Secure Your Key**: A `.json` file will be downloaded. **Treat this file like a password**. Do not commit it to your public repository. It's best to store this securely (e.g., in a secret manager or a secure local environment).

### **Step 2: Configure Firebase Cloud Functions**

Your backend (Firebase Functions) needs to use this new service account key to send notifications.

1.  **Store the Key**: Place the downloaded `.json` key file inside your `functions` directory. For example: `functions/serviceAccountKey.json`.

2.  **Add to `.gitignore`**: **Crucially**, add the key file to your `functions/.gitignore` to prevent it from being committed to version control:
    ```
    # functions/.gitignore
    serviceAccountKey.json
    ```

3.  **Update `functions/index.js`**: Modify your main functions file to initialize the Admin SDK with this service account.

    ```javascript
    // functions/index.js
    const functions = require('firebase-functions');
    const admin = require('firebase-admin');

    // Import the service account key
    const serviceAccount = require('./serviceAccountKey.json');

    // Initialize the app with the service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://[YOUR_PROJECT_ID].firebaseio.com' // Optional: if you use Realtime Database
    });

    // Your other cloud functions go here...
    // Example: A function to send a notification
    exports.sendTestNotification = functions.https.onCall(async (data, context) => {
      const { token, title, body } = data;

      if (!token) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "token" argument.');
      }

      const payload = {
        notification: {
          title: title || 'Test Notification',
          body: body || 'This is a test from the cloud!',
        },
      };

      try {
        const response = await admin.messaging().sendToDevice(token, payload);
        console.log('Successfully sent message:', response);
        return { success: true, response };
      } catch (error) {
        console.error('Error sending message:', error);
        throw new functions.https.HttpsError('internal', 'Error sending notification.');
      }
    });
    ```

### **Step 3: iOS & Android Client Setup (No Changes Needed)**

Your existing client-side code is already in great shape. No changes are required for the following:

-   **`NotificationService.ts`**: Your service is well-structured and correctly uses `expo-notifications` to get the device token. Continue using it as is.
-   **`app.json`**: The `expo-notifications` plugin configuration is correct.
-   **Dependencies**: Your `package.json` should already contain `expo-notifications` and `expo-device`.

### **Step 4: Apple Push Notification Key (APNs) - For iOS**

This process remains the same. If you haven't done it yet, you must upload your APNs key to Firebase.

1.  **Create `.p8` Key**: Go to your [Apple Developer Account](https://developer.apple.com/account/resources/authkeys/list) -> **Certificates, Identifiers & Profiles** -> **Keys**. Create a new key with the **Apple Push Notifications service (APNs)** enabled.
2.  **Upload to Firebase**: In your **Firebase Project Settings** -> **Cloud Messaging** -> **Apple app configuration**, upload the downloaded `.p8` file along with your **Key ID** and **Team ID**.

### **Step 5: Testing the Full Flow**

1.  **Get a Device Token**: On a **real physical device** (not a simulator), log into your app. Your `NotificationService.ts` should get the token and save it to the user's document in Firestore.
2.  **Verify the Token**: Check Firestore to confirm that the `pushToken` field has been saved for your test user.
3.  **Trigger the Cloud Function**: Call your `sendTestNotification` function (or any other function you've set up) with the user's `pushToken`.
4.  **Receive Notification**: You should receive a push notification on your device.

---

This modern setup is more secure, professional, and aligned with current best practices. The primary change is on the backend (Firebase Functions), leaving your well-structured Expo client code untouched.
