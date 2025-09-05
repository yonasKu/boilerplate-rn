import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  time?: string;
  icon?: string;
  actionText?: string;
  actionUrl?: string;
  data?: any;
  isPush?: boolean;
}

// Global notification state - singleton
let globalNotifications: Notification[] = [];
let listeners: Array<(notifications: Notification[]) => void> = [];
// Locally suppressed notification ids (do not re-show these toasts in this session)
const suppressedIds = new Set<string>();

const notifyListeners = () => {
  listeners.forEach(listener => listener(globalNotifications));
};

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>(globalNotifications);

  useEffect(() => {
    // Subscribe to global state changes
    listeners.push(setNotifications);
    
    return () => {
      // Cleanup listener
      listeners = listeners.filter(l => l !== setNotifications);
    };
  }, []);

  // Unified notification handler
  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      ...notification,
    };
    console.log('🔔 useNotification: Adding notification:', newNotification);

    // Update global state
    globalNotifications = [...globalNotifications, newNotification];
    notifyListeners();

    // Auto-remove non-persistent notifications after 3 seconds
    if (!notification.data?.persistent) {
      setTimeout(() => {
        console.log('🔔 Auto-removing notification:', id);
        removeNotification(id);
      }, 3000);
    } else {
      console.log('🔔 Notification: Keeping persistent notification visible');
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    // Add to suppression set so it won't re-show in this session
    try {
      const notif = globalNotifications.find(n => n.id === id);
      const nid = (notif && typeof notif.data?.notificationId === 'string') ? notif.data.notificationId : id;
      if (nid) suppressedIds.add(nid);
    } catch {}
    globalNotifications = globalNotifications.filter(n => n.id !== id);
    notifyListeners();
  }, []);

  // Handle push notifications and convert to in-app notifications
  const handlePushNotification = useCallback((pushData: any) => {
    const notification: Notification = {
      id: pushData.notificationId || Date.now().toString(),
      title: pushData.title || 'Notification',
      message: pushData.body || pushData.message || '',
      type: pushData.type || 'info',
      time: pushData.time || 'Now',
      isPush: true,
    };

    showNotification(notification);
  }, [showNotification]);

  // Real backend notification integration - ACTUAL FIRESTORE CONNECTION
  const fetchRealNotifications = useCallback(async (userId: string) => {
    try {
      console.log('🔔 Connecting to REAL backend notifications for user:', userId);
      
      // Use the same pattern as other services in codebase
      const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase/firebaseConfig');
      
      // Create query for user's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      // Real-time listener
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot: any) => {
        const realNotifications: Notification[] = [];
        
        snapshot.forEach((doc: any) => {
          // Skip locally suppressed notifications to avoid re-showing a toast
          if (suppressedIds.has(doc.id)) return;
          const data = doc.data();
          realNotifications.push({
            id: doc.id,
            title: data.title || 'Notification',
            message: data.message || '',
            type: (data.type || 'info') as Notification['type'],
            time: data.createdAt?.toDate()?.toLocaleString() || 'Recently',
            actionText: data.actionText,
            actionUrl: data.actionUrl,
            data: { ...(data.data || {}), notificationId: doc.id },
            isPush: true,
          });
        });
        
        // Clear existing notifications and add real ones
        globalNotifications.length = 0;
        globalNotifications.push(...realNotifications);
        notifyListeners();
        
        console.log('🔔 REAL notifications loaded from Firestore:', realNotifications.length);
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error('🔔 Error loading REAL notifications:', error);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  // Setup real-time notification listener
  const setupRealTimeNotifications = useCallback((userId: string): Promise<(() => void) | undefined> => {
    console.log('🔔 Setting up real-time notifications for user:', userId);
    
    // Connect to Firestore notifications collection
    return fetchRealNotifications(userId);
  }, [fetchRealNotifications]);

  return {
    notifications,
    showNotification,
    removeNotification,
    handlePushNotification,
    fetchRealNotifications,
    setupRealTimeNotifications,
  };
};
