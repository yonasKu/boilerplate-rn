import { auth, db } from './firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

// This is required for the auth session to work properly on web and mobile
WebBrowser.maybeCompleteAuthSession();

// Define the shape of a user profile
interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  subscription: {
    plan: string;
    status: string;
    startDate: Date;
    trialEndDate?: Date;
  };
  lifestage: string | null;
  children: Array<{
    name: string;
    age?: number;
    gender?: string;
  }>;
  createdAt: Date;
  onboarded: boolean;
}

/**
 * Signs up a new user with email and password and creates a user profile in Firestore.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @returns {Promise<UserCredential>} - The created user credential.
 */
export const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create a user document in Firestore with subscription data
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    name: `${firstName} ${lastName}`,
    subscription: {
      plan: 'basic', // Default plan, will be updated in pricing/checkout
      status: 'trial',
      startDate: new Date(),
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
    },
    lifestage: null, // Will be set during Add Profile
    children: [], // Will be populated during Add Child Details
    createdAt: new Date(),
    onboarded: false, // Will be true after completing Add Child Details
  });

  // Sign out the user immediately to prevent auto-login
  await auth.signOut();
  
  return userCredential;
};

/**
 * Signs in a user with email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<UserCredential>} - The signed-in user credential.
 */
export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export const signOut = () => {
  return firebaseSignOut(auth);
};

/**
 * Initiates Google Sign-In flow.
 * @returns {Promise<UserCredential>}
 */
/**
 * A custom hook to handle Google Sign-In for native apps (iOS/Android).
 * It prompts the user to sign in, retrieves an ID token, and then signs them into Firebase.
 * If the user is new, it creates a new user profile in Firestore.
 * 
 * @returns An object with the `promptAsync` function to initiate the sign-in flow.
 */
export const useGoogleSignIn = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_ANDROID_CLIENT_ID, 
  });

  React.useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === 'success') {
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);

        // After signing in, check if a user document exists. If not, create one.
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Extract first and last name from display name
          const displayName = user.displayName || '';
          const nameParts = displayName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          const newUserProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            name: displayName || user.email?.split('@')[0] || 'User',
            subscription: {
              plan: 'basic',
              status: 'trial',
              startDate: new Date(),
              trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            lifestage: null,
            children: [],
            createdAt: new Date(),
            onboarded: false,
          };
          await setDoc(userDocRef, newUserProfile);
          
          // Sign out the user immediately to prevent auto-login for new accounts
          await auth.signOut();
        }
      }
    };

    handleResponse();
  }, [response]);

  return { promptAsync };
};
