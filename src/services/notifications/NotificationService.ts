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

      const token = await Notifications.getExpoPushTokenAsync();
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
      
      await setDoc(doc(getFirestore(), 'users', userId), {
        pushToken: token,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
    }
  }

  /**
   * Schedule daily reminder notification
   * @param hour - Hour (0-23)
   * @param minute - Minute (0-59)
   */
  static async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Journal Reminder',
          body: 'Time to capture today\'s memories!',
          data: { screen: '/journal' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          repeats: true
        } as Notifications.NotificationTriggerInput
      });
    } catch (error) {
      console.error('Schedule reminder error:', error);
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
      
      return docSnap.exists() ? docSnap.data() : null;
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
