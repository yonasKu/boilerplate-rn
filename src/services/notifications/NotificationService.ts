// Notification Service - Ready for iOS Push Notifications
// This service is fully coded and commented for when you're ready to enable push notifications
// All iOS setup (APNs key, Firebase upload) must be completed first

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export class NotificationService {
  /**
   * Request notification permissions from user
   * @returns Promise<boolean> - true if granted, false if denied
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  /**
   * Get push notification token for device
   * @returns Promise<string | null> - token string or null if failed
   */
  static async getPushToken(): Promise<string | null> {
    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return null;
      }

      // Use environment variables for Firebase config
      const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
      if (!projectId) {
        console.error('Firebase project ID not found in environment variables');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      return token.data;
    } catch (error) {
      console.error('Push token error:', error);
      return null;
    }
  }

  /**
   * Save push token to Firestore user document
   * @param userId - Firebase user ID
   * @param token - Push notification token
   */
  static async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { doc, setDoc } = await import('firebase/firestore');
      
      console.log('Saving device token:', { userId, token, platform: Platform.OS });
      
      await setDoc(doc(getFirestore(), 'users', userId, 'devices', token), {
        token: token,
        platform: Platform.OS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('Device token saved successfully to devices collection');
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
    }
  }

  /**
   * Register device token using cloud function
   * @param userId - Firebase user ID
   * @param token - Push notification token
   * @returns Promise<void>
   */
  static async registerDeviceToken(userId: string, token: string): Promise<void> {
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      
      console.log('Registering device token via cloud function:', { userId, token, platform: Platform.OS });
      
      const registerToken = httpsCallable(functions, 'registerDeviceToken');
      await registerToken({
        token,
        platform: Platform.OS,
      });
      
      console.log('Device token registered successfully via cloud function');
    } catch (error) {
      console.error('Error registering device token via cloud function:', error);
      throw error;
    }
  }

  /**
   * Backend handles all reminder scheduling via Firebase Functions
   * Client only manages preferences and tokens
   */

  /**
   * Remove device token using cloud function on logout
   * @param userId - Firebase user ID
   * @param token - Push notification token to remove
   * @returns Promise<void>
   */
  static async removeDeviceToken(userId: string, token: string): Promise<void> {
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      
      console.log('Removing device token via cloud function:', { userId, token });
      
      const removeToken = httpsCallable(functions, 'removeDeviceToken');
      await removeToken({ token });
      
      console.log('Device token removed successfully via cloud function');
    } catch (error) {
      console.error('Error removing device token via cloud function:', error);
      // Don't throw - this is cleanup and shouldn't break logout
    }
  }

  /**
   * Get user notification preferences from Firestore
   * @param userId - Firebase user ID
   */
  static async getNotificationPreferences(userId: string): Promise<any> {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const docRef = doc(getFirestore(), 'users', userId, 'notifications', 'preferences');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Return default preferences if none exist
      return {
        pushNotifications: { enabled: false },
        dailyEntries: { enabled: true, push: true, email: false },
        comments: { enabled: false, push: true, email: false },
        likes: { enabled: true, push: true, email: false },
        weeklyRecaps: { enabled: true, push: true, email: true },
        monthlyRecaps: { enabled: true, push: true, email: true },
      };
    } catch (error) {
      console.error('Get preferences error:', error);
      return null;
    }
  }

  /**
   * Update user notification preferences
   * @param userId - Firebase user ID
   * @param preferences - Notification preferences object
   */
  static async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { doc, setDoc } = await import('firebase/firestore');
      
      await setDoc(doc(getFirestore(), 'users', userId, 'notifications', 'preferences'), {
        ...preferences,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Update preferences error:', error);
    }
  }

  /**
   * Update specific notification preference
   * @param userId - Firebase user ID
   * @param key - Preference key (dailyEntries, comments, likes, etc.)
   * @param enabled - Whether the preference is enabled
   */
  static async updatePreference(userId: string, key: string, enabled: boolean): Promise<void> {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { doc, setDoc } = await import('firebase/firestore');
      
      await setDoc(doc(getFirestore(), 'users', userId, 'notifications', 'preferences'), {
        [key]: { enabled, push: true, email: false },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Update preference error:', error);
    }
  }

  /**
   * Backend handles all reminder scheduling via Firebase Functions
   * Client only manages preferences and tokens
   */

  /**
   * Remove push token from Firestore
   * @param userId - Firebase user ID
   */
  static async removeTokenFromFirestore(userId: string): Promise<void> {
    try {
      const { getFirestore } = await import('firebase/firestore');
      const { doc, setDoc } = await import('firebase/firestore');
      
      await setDoc(doc(getFirestore(), 'users', userId), {
        pushToken: null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Remove token error:', error);
    }
  }
}

// Export for use in components
export default NotificationService;
