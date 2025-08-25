import { auth, db } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  UserCredential,
  sendEmailVerification,
  sendPasswordResetEmail
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
  isVerified: boolean;
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

  // Send verification email
  await sendEmailVerification(user);
  
  // Create user profile in Firestore
  const fullName = `${firstName} ${lastName}`.trim();
  const now = new Date();
  
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebaseConfig');
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: fullName,
      email: email,
      lifestage: null, // Will be set in AddProfileScreen
      subscription: {
        plan: 'free',
        status: 'trial',
        startDate: now,
        trialEndDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days trial
      },
      children: [],
      createdAt: now,
      updatedAt: now,
      onboarded: false
    });
    
    console.log('User profile created successfully in Firestore');
  } catch (error) {
    console.error('Error creating user profile:', error);
    // Don't throw here - profile creation failure shouldn't prevent signup
  }
  
  // Keep user signed in for verification screen
  return userCredential;
};

/**
 * Sends a password reset email to the user.
 * @param {string} email - The user's email address.
 * @returns {Promise<void>} - Promise that resolves when email is sent.
 */
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
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

        // Ensure the users/{uid} document exists with required fields
        try {
          const { ensureUserDocumentExists } = await import('../../services/userService');
          const user = userCredential.user;
          await ensureUserDocumentExists(
            user.uid,
            user.displayName ?? null,
            user.email ?? null
          );
        } catch (e) {
          console.error('Failed to ensure user document after Google sign-in:', e);
        }
      }
    };

    handleResponse();
  }, [response]);

  return { promptAsync };
};
