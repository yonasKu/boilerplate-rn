import { initializeApp, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Helper function to get required environment variables
const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  // Log the key and whether a value was found, but not the value itself for security.
  console.log(`[Firebase Config] Reading env var: ${key} - Value found: ${!!value}`);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Your web app's Firebase configuration, securely loaded from environment variables.
const firebaseConfig = {
  apiKey: getRequiredEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getRequiredEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getRequiredEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRequiredEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

// Initialize Firebase app
const createFirebaseApp = (firebaseConfig = {}) => {
  try {
    return getApp();
  } catch (error) {
    return initializeApp(firebaseConfig);
  }
};

const app = createFirebaseApp(firebaseConfig);

// Initialize and export Firebase services
// For React Native, we need to handle auth initialization differently
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // For React Native, use initializeAuth with persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If already initialized, get the existing instance
    auth = getAuth(app);
  }
}
export const db = getFirestore(app);
export const storage = getStorage(app);

export { auth };
export default app;
