// Notification Service - Ready for iOS Push Notifications
// This service is fully coded and commented for when you're ready to enable push notifications
// All iOS setup (APNs key, Firebase upload) must be completed first

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

export class NotificationService {
  // Ensure a default handler so foreground notifications are shown
  static configured = (() => {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          // iOS specific (Expo SDK 50+)
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (e) {
      console.warn('Failed to set notification handler:', e);
    }
    return true;
  })();

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

      // Android: ensure a default channel exists
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          });
        } catch (e) {
          console.warn('Failed to create Android notification channel:', e);
        }
      }

      // Determine EAS projectId for Expo push tokens
      const easProjectId =
        (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
        (Constants as any)?.easConfig?.projectId ||
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

      const token = easProjectId
        ? await Notifications.getExpoPushTokenAsync({ projectId: easProjectId })
        : await Notifications.getExpoPushTokenAsync();
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
      // Warn if current auth user is missing or does not match provided userId
      const auth = getAuth();
      const currentUid = auth.currentUser?.uid;
      if (!currentUid) {
        console.warn('registerDeviceToken: No signed-in user. Will register with anonymous auth; token may be saved under a different uid than', userId);
      } else if (currentUid !== userId) {
        console.warn('registerDeviceToken: Auth UID mismatch', { currentUid, expectedUserId: userId });
      }

      const idToken = await NotificationService.getIdTokenOrAnon();
      const url = NotificationService.buildFunctionUrl('registerDeviceToken');

      console.log('Registering device token via HTTP:', { userId, token, platform: Platform.OS });

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token, platform: Platform.OS }),
      });
      if (!resp.ok) {
        const err = await NotificationService.safeJson(resp);
        throw new Error(err?.error || 'Failed to register device token');
      }
      console.log('Device token registered successfully via HTTP');
      // Explicit success marker for debugging
      console.log('NF FECICE IS REGISTERED', { registeredUid: currentUid || 'anonymous', token });
    } catch (error) {
      console.error('Error registering device token via HTTP:', error);
      throw error;
    }
  }

  /**
   * Request permissions, fetch token and register it both in Firestore and via HTTP.
   * Returns whether permission was granted and the token (if any).
   */
  static async initAndRegister(userId: string): Promise<{ granted: boolean; token?: string | null }> {
    try {
      const granted = await NotificationService.requestPermissions();
      if (!granted) return { granted: false };
      const token = await NotificationService.getPushToken();
      if (!token) return { granted: true, token: null };
      await NotificationService.saveTokenToFirestore(userId, token);
      await NotificationService.registerDeviceToken(userId, token);
      return { granted: true, token };
    } catch (e) {
      console.error('initAndRegister error:', e);
      return { granted: false };
    }
  }

  /**
   * Unregister current device by discovering its token and removing it server-side.
   * Safe to call on logout.
   */
  static async unregisterCurrentDevice(userId: string): Promise<void> {
    try {
      const token = await NotificationService.getPushToken();
      if (!token) return;
      await NotificationService.removeDeviceToken(userId, token);
      // Best-effort local cleanup marker
      try {
        const { getFirestore, doc, setDoc } = await import('firebase/firestore');
        await setDoc(
          doc(getFirestore(), 'users', userId, 'devices', token),
          { deletedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch {}
    } catch (e) {
      console.error('unregisterCurrentDevice error:', e);
    }
  }

  /**
   * Send a test push via backend. If tokenOverride is not provided, attempts to use current device token.
   */
  static async sendTestPush(title?: string, body?: string, tokenOverride?: string): Promise<boolean> {
    try {
      const token = tokenOverride || (await NotificationService.getPushToken());
      if (!token) throw new Error('No device token available');
      const idToken = await NotificationService.getIdTokenOrAnon();
      const url = NotificationService.buildFunctionUrl('sendTestNotification');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token, title, body }),
      });
      if (!resp.ok) {
        const err = await NotificationService.safeJson(resp);
        throw new Error(err?.error || 'Failed to send test notification');
      }
      return true;
    } catch (e) {
      console.error('sendTestPush error:', e);
      return false;
    }
  }

  /**
   * Remove device token using cloud function on logout
   * @param userId - Firebase user ID
   * @param token - Push notification token to remove
   * @returns Promise<void>
   */
  static async removeDeviceToken(userId: string, token: string): Promise<void> {
    try {
      const idToken = await NotificationService.getIdTokenOrAnon();
      const url = NotificationService.buildFunctionUrl('removeDeviceToken');

      console.log('Removing device token via HTTP:', { userId, token });

      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token }),
      });
      if (!resp.ok) {
        const err = await NotificationService.safeJson(resp);
        console.error('Error removing device token via HTTP:', err);
        // Don't throw - this is cleanup and shouldn't break logout
        return;
      }
      console.log('Device token removed successfully via HTTP');
    } catch (error) {
      console.error('Error removing device token via HTTP:', error);
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
      
      const docRef = doc(getFirestore(), 'users', userId, 'notificationPreferences', 'preferences');
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
      
      await setDoc(doc(getFirestore(), 'users', userId, 'notificationPreferences', 'preferences'), {
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
      
      await setDoc(doc(getFirestore(), 'users', userId, 'notificationPreferences', 'preferences'), {
        [key]: { enabled, push: true, email: false },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Update preference error:', error);
    }
  }

  // --- HTTP helpers ---
  private static buildFunctionUrl(name: string): string {
    const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string | undefined;
    if (!projectId) throw new Error('Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID');
    return `https://us-central1-${projectId}.cloudfunctions.net/${name}`;
  }

  private static async getIdTokenOrAnon(): Promise<string> {
    const auth = getAuth();
    try {
      const user = auth.currentUser || (await signInAnonymously(auth)).user;
      return await user.getIdToken();
    } catch {
      const cred = await signInAnonymously(auth);
      return await cred.user.getIdToken();
    }
  }

  private static async safeJson(resp: any): Promise<any | undefined> {
    try { return await resp.json(); } catch { return undefined; }
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

  /**
   * Mark a single notification as read.
   * @param notificationId Firestore document ID in the top-level `notifications` collection
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { getFirestore, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(getFirestore(), 'notifications', notificationId), {
        isRead: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('markNotificationAsRead error:', error);
    }
  }

  /**
   * Mark multiple notifications as read in a single batch write.
   * Only updates docs provided; safe to call repeatedly.
   */
  static async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    if (!notificationIds || notificationIds.length === 0) return;
    try {
      const { getFirestore, writeBatch, doc, serverTimestamp } = await import('firebase/firestore');
      const db = getFirestore();
      const batch = writeBatch(db);
      const ts = serverTimestamp();
      for (const id of notificationIds) {
        batch.update(doc(db, 'notifications', id), { isRead: true, readAt: ts });
      }
      await batch.commit();
    } catch (error) {
      console.error('markNotificationsAsRead batch error:', error);
    }
  }
}

// Export for use in components
export default NotificationService;
