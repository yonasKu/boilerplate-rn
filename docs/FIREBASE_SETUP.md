# SproutBook: Firebase Setup & Integration Guide

This guide provides a detailed, step-by-step walkthrough for setting up and integrating Firebase into the SproutBook application. It covers everything from project creation in the Firebase dashboard to code integration within your existing project structure.

---

### **Part 1: Firebase Project Setup (Dashboard)**

**Goal:** Create a new Firebase project to house your app's backend services.

1.  **Navigate to the Firebase Console:** Open your browser and go to [console.firebase.google.com](https://console.firebase.google.com).
2.  **Create a Project:**
    *   Click on **"Create a project"**.
    *   **Project Name:** Enter `SproutBook` or a name of your choice.
    *   **Google Analytics:** It's recommended to keep this enabled. It provides useful analytics about your app usage for free. Click **"Continue"**.
    *   Select or create a new Google Analytics account.
    *   Click **"Create project"**. Firebase will take a minute to provision your new project.

---

### **Part 2: Connecting Your App to Firebase**

**Goal:** Get the necessary API keys from Firebase and install the Firebase SDK into your React Native project.

1.  **Install Firebase SDK:**
    *   Open your terminal in the root directory of your `SproutBook` project.
    *   Run the following command. `expo install` is preferred over `npm install` because it ensures you get a version of the library that is compatible with your Expo SDK version.

    ```bash
    npx expo install firebase
    ```

2.  **Get Your Firebase API Keys:**
    *   In your Firebase project dashboard, click the **Gear icon** next to "Project Overview" and select **"Project settings"**.
    *   Under the **"Your apps"** card, click the **Web icon** (`</>`) to create a new web app configuration. This is what React Native uses.
    *   **App nickname:** Enter `SproutBook-Mobile` and click **"Register app"**.
    *   Firebase will display a `firebaseConfig` object. **Do not copy the whole object yet.** We only need the values.

3.  **Store API Keys Securely:**
    *   In your code editor, create a new file in the root of your project named `.env`.
    *   Copy and paste the following into the `.env` file, replacing the placeholder values with the actual keys from the `firebaseConfig` object you just saw:

    ```env
    # Firebase Configuration - Get these from your Firebase project settings
    EXPO_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY_HERE"
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN_HERE"
    EXPO_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID_HERE"
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET_HERE"
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID_HERE"
    EXPO_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID_HERE"
    ```
    *   **IMPORTANT:** Add `.env` to your `.gitignore` file to prevent your secret keys from being committed to version control. Open `.gitignore` and add this line to the bottom:

    ```
    .env
    ```

4.  **Create the Firebase Config File:**
    *   In your `src` folder, create a new folder structure: `lib/firebase`.
    *   Inside `src/lib/firebase`, create a new file named `firebaseConfig.ts`.
    *   This file will initialize Firebase for your app. Copy and paste this code:

    ```typescript
    import { initializeApp } from 'firebase/app';
    import { getAuth } from 'firebase/auth';
    import { getFirestore } from 'firebase/firestore';
    import { getStorage } from 'firebase/storage';

    // Your web app's Firebase configuration, securely loaded from environment variables.
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize and export Firebase services for use throughout the app
    export const auth = getAuth(app);
    export const db = getFirestore(app);
    export const storage = getStorage(app);

    export default app;
    ```

---

### **Part 3: Enabling Firebase Services (Dashboard)**

**Goal:** Activate the specific Firebase products we need: Authentication, Firestore, and Storage.

1.  **Enable Authentication:**
    *   In the Firebase Console, go to the **"Build"** section in the left menu and click **"Authentication"**.
    *   Click **"Get started"**.
    *   On the **"Sign-in method"** tab, enable the providers you need:
        *   **Email/Password:** Click, enable the toggle, and save.
        *   **Google:** Click, enable the toggle, select your project's support email, and save.
        *   **Apple:** Click, enable the toggle, and save.

2.  **Set Up Firestore Database:**
    *   From the **"Build"** menu, click **"Firestore Database"**.
    *   Click **"Create database"**.
    *   Select **"Start in production mode"**. This ensures your database is secure by default. Click **"Next"**.
    *   Choose a Firestore location (e.g., `us-central1`). This cannot be changed later. Click **"Enable"**.
    *   Go to the **"Rules"** tab and paste these rules to allow users to only read/write their own data. Click **"Publish"**.

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Users can only read and write their own profile data
        match /users/{userId} {
          allow read, update, delete: if request.auth.uid == userId;
          allow create: if request.auth.uid != null;

          // Users can only manage their own sub-collections
          match /{allChildren=**} {
            allow read, write: if request.auth.uid == userId;
          }
        }
      }
    }
    ```

3.  **Set Up Cloud Storage:**
    *   From the **"Build"** menu, click **"Storage"**.
    *   Click **"Get started"**.
    *   Follow the security rules dialog, selecting **"Start in production mode"**. Click **"Next"**.
    *   Confirm the location (it should default to your Firestore location). Click **"Done"**.
    *   Go to the **"Rules"** tab and paste these rules to allow users to only manage their own files. Click **"Publish"**.

    ```
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        // Users can only upload to their own folder, identified by their UID
        match /users/{userId}/{allPaths=**} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```

---

### **Part 4: Codebase Integration**

**Goal:** Update your existing `AuthContext` to use Firebase and create utility functions for database interactions.

1.  **Update AuthContext:**
    *   Open `src/context/AuthContext.tsx`.
    *   Replace its entire content with the code below. This new version will manage the user's authentication state using Firebase.

    ```typescript
    import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
    import { auth } from '@/lib/firebase/firebaseConfig';
    import { onAuthStateChanged, User } from 'firebase/auth';

    // Define the shape of the context data
    interface AuthContextType {
      user: User | null; // The Firebase user object
      isAuthenticated: boolean; // Simple boolean flag
      isLoading: boolean; // To handle initial auth state loading
    }

    // Create the context
    const AuthContext = createContext<AuthContextType | undefined>(undefined);

    // Create the provider component
    export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
      const [user, setUser] = useState<User | null>(null);
      const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
        // onAuthStateChanged returns an unsubscribe function
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
      }, []);

      const value = {
        user,
        isAuthenticated: !!user, // Coerce user object to boolean
        isLoading,
      };

      return (
        <AuthContext.Provider value={value}>
          {!isLoading && children} 
        </AuthContext.Provider>
      );
    };

    // Custom hook to use the auth context
    export const useAuth = () => {
      const context = useContext(AuthContext);
      if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
      }
      return context;
    };
    ```

2.  **Update Main Layout (`_layout.tsx`):**
    *   Your `src/app/_layout.tsx` file needs to be updated to correctly handle routing based on the new Firebase authentication state.
    *   Open it and replace the commented-out `useEffect` with this active version:

    ```typescript
    // Inside the Layout() function in src/app/_layout.tsx

    useEffect(() => {
      // Wait until fonts are loaded, onboarding status is checked, and auth state is known.
      if (!fontsLoaded || viewedOnboarding === null || isLoading) return;

      const inAuthGroup = segments[0] === '(auth)';

      // If onboarding hasn't been seen, it's the highest priority.
      if (!viewedOnboarding) {
        router.replace('/onboarding');
        return;
      }

      // If the user is authenticated but is in the auth flow (e.g., on login screen),
      // redirect them to the main part of the app.
      if (isAuthenticated && inAuthGroup) {
        router.replace('/(main)/journal');
      } 
      // If the user is NOT authenticated and is outside the auth flow,
      // send them to the welcome screen to log in or sign up.
      else if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    }, [isAuthenticated, segments, fontsLoaded, router, viewedOnboarding, isLoading]);
    ```

---

### **Part 5: Authentication Flow Implementation**

This section tracks the implementation of different sign-in methods.

- [x] **Email & Password Authentication:**
    - [x] Created `src/lib/firebase/auth.ts` with `signUpWithEmail` and `signInWithEmail` functions.
    - [x] Integrated `signUpWithEmail` into `SignUpScreen.tsx` with loading and error handling.
    - [x] Integrated `signInWithEmail` into `LoginScreen.tsx` with loading and error handling.

- [ ] **Social Authentication (Google & Apple):**
    - [ ] **Google Sign-In (iOS & Android):**
        1.  **Install Dependencies:** Install the required packages for native social auth.
            ```bash
            npx expo install expo-auth-session expo-crypto expo-web-browser
            ```
        2.  **Configure Google Sign-In:**
            *   You will need the `webClientId` and `iosClientId` from your `google-services.json` and `GoogleService-Info.plist` files. These are generated when you add the native iOS/Android apps to your Firebase project.
            *   Add these keys to your `.env` file:
                ```env
                EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID="YOUR_WEB_CLIENT_ID_HERE"
                EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID="YOUR_IOS_CLIENT_ID_HERE"
                ```
        3.  **Update `auth.ts`:** Replace the web-based `signInWithGoogle` function with the native version using `expo-auth-session`.
        4.  **Connect UI:** Update the "Sign in with Google" buttons in `LoginScreen.tsx` and `SignUpScreen.tsx` to trigger the new function.

    - [ ] **Apple Sign-In (iOS only):**
        *   (Steps to be detailed later)

---

### **Part 6: Broader Next Steps**

With the core authentication flows in place, you will be ready to:

1.  **Create Firestore Utilities:** Build functions in a `src/lib/firebase/firestore.ts` file to create user documents, add journal entries, etc.
2.  **Implement Media Uploads:** Use Firebase Storage functions to upload photos and videos from the `NewEntryScreen.tsx`.
