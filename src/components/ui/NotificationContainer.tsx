import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Toast } from './Toast';
import { useNotification } from '../../hooks/useNotification';
import { router } from 'expo-router';
import NotificationService from '@/services/notifications/NotificationService';

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  // Debug logging
  console.log('🔔 NotificationContainer: Current notifications:', notifications.length);
  console.log('🔔 NotificationContainer: Notifications data:', notifications);

  const handleAction = async (notification: any) => {
    if (notification.actionUrl) {
      console.log('🔔 NotificationContainer: Navigate to:', notification.actionUrl);
      try {
        router.push(notification.actionUrl);
      } catch (e) {
        console.warn('🔔 NotificationContainer: Navigation error', e);
      }
    }
    // If this toast originated from a Firestore notification and includes its id, mark as read
    try {
      const firestoreNotificationId = notification?.data?.notificationId as string | undefined;
      if (firestoreNotificationId) {
        await NotificationService.markNotificationAsRead(firestoreNotificationId);
      }
    } catch (e) {
      console.warn('🔔 NotificationContainer: Failed to mark notification as read from toast', e);
    }
    removeNotification(notification.id);
  };

  if (notifications.length === 0) {
    console.log('🔔 NotificationContainer: No notifications to display');
    return null;
  }

  console.log('🔔 NotificationContainer: RENDERING notifications:', notifications.length);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <Toast
          key={notification.id}
          id={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          time={notification.time}
          actionText={notification.actionText}
          onClose={async () => {
            try {
              // If producers opt in, mark as read in Firestore when the toast is closed (tapped or auto-dismissed)
              const shouldMarkRead = notification?.data?.markReadOnClose === true;
              const firestoreNotificationId = notification?.data?.notificationId as string | undefined;
              if (shouldMarkRead && firestoreNotificationId) {
                await NotificationService.markNotificationAsRead(firestoreNotificationId);
              }
            } catch (e) {
              console.warn('🔔 NotificationContainer: Failed optional mark read on close', e);
            } finally {
              removeNotification(notification.id);
            }
          }}
          onAction={() => handleAction(notification)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
});
