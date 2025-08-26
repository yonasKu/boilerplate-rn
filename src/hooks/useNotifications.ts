import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Types
export interface NotificationPreferences {
  dailyReminders: boolean;
  milestoneAlerts: boolean;
  partnerUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "07:00"
  };
}

export interface UseNotificationsReturn {
  // State
  isEnabled: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences;
  pushToken: string | null;
  
  // Actions
  requestPermissions: () => Promise<boolean>;
  getPushToken: () => Promise<string | null>;
  saveTokenToFirestore: (token: string) => Promise<void>;
  removeTokenFromFirestore: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  scheduleDailyReminder: (title: string, body: string, hour: number, minute: number) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

// Default preferences
const defaultPreferences: NotificationPreferences = {
  dailyReminders: true,
  milestoneAlerts: true,
  partnerUpdates: true,
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "07:00"
  }
};

export const useNotifications = (): UseNotificationsReturn => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Check if notifications are available
  const checkAvailability = useCallback(async () => {
    try {
      if (!Device.isDevice) {
        console.log('Notifications only work on physical devices');
        return false;
      }
      
      // Check if Firebase is configured
      try {
        const auth = getAuth();
        return !!auth.currentUser;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }, []);

  // Request notification permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const available = await checkAvailability();
      if (!available) return false;

      const { status } = await Notifications.requestPermissionsAsync();
      setIsEnabled(status === 'granted');
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }, [checkAvailability]);

  // Get push token
  const getPushToken = useCallback(async (): Promise<string | null> => {
    try {
      const available = await checkAvailability();
      if (!available) return null;

      // Use EAS projectId for Expo push tokens (this is NOT the Firebase projectId)
      const easProjectId =
        (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
        (Constants as any)?.easConfig?.projectId ||
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

      const { data } = easProjectId
        ? await Notifications.getExpoPushTokenAsync({ projectId: easProjectId })
        : await Notifications.getExpoPushTokenAsync();
      
      setPushToken(data);
      return data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }, [checkAvailability]);

  // Save token to Firestore
  const saveTokenToFirestore = useCallback(async (token: string) => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const { getFirestore } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');
      const db = getFirestore(getApp());
      const { doc, setDoc } = await import('firebase/firestore');

      await setDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', 'pushToken'), {
        token,
        platform: Platform.OS,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving token to Firestore:', error);
    }
  }, []);

  // Remove token from Firestore
  const removeTokenFromFirestore = useCallback(async () => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const { getFirestore } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');
      const db = getFirestore(getApp());
      const { doc, deleteDoc } = await import('firebase/firestore');

      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', 'pushToken'));
    } catch (error) {
      console.error('Error removing token from Firestore:', error);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);

      const { getFirestore } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');
      const db = getFirestore(getApp());
      const { doc, setDoc } = await import('firebase/firestore');

      await setDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', 'preferences'), {
        ...updated,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [preferences]);

  // Schedule daily reminder
  const scheduleDailyReminder = useCallback(async (title: string, body: string, hour: number, minute: number) => {
    try {
      const available = await checkAvailability();
      if (!available || !preferences.dailyReminders) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          repeats: true,
        } as Notifications.NotificationTriggerInput,
      });
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }, [checkAvailability, preferences.dailyReminders]);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const auth = getAuth();
        if (!auth.currentUser) return;

        const { getFirestore } = await import('firebase/firestore');
        const { getApp } = await import('firebase/app');
        const db = getFirestore(getApp());
        const { doc, getDoc } = await import('firebase/firestore');

        const docRef = doc(db, 'users', auth.currentUser.uid, 'notifications', 'preferences');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPreferences({ ...defaultPreferences, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  return {
    isEnabled,
    isLoading,
    preferences,
    pushToken,
    requestPermissions,
    getPushToken,
    saveTokenToFirestore,
    removeTokenFromFirestore,
    updatePreferences,
    scheduleDailyReminder,
    cancelAllNotifications,
  };
};
