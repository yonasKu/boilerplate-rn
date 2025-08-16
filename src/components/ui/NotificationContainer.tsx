import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Toast } from './Toast';
import { useNotification } from '../../hooks/useNotification';

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  // Debug logging
  console.log('🔔 NotificationContainer: Current notifications:', notifications.length);
  console.log('🔔 NotificationContainer: Notifications data:', notifications);

  const handleAction = (notification: any) => {
    if (notification.actionUrl) {
      console.log('🔔 NotificationContainer: Navigate to:', notification.actionUrl);
    }
    removeNotification(notification.id);
  };

  if (notifications.length === 0) {
    console.log('🔔 NotificationContainer: No notifications to display');
    return null;
  }

  console.log('🔔 NotificationContainer: RENDERING notifications:', notifications.length);

  return (
    <View style={[styles.container, { borderWidth: 3, borderColor: 'red' }]} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <Toast
          key={notification.id}
          id={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          time={notification.time}
          actionText={notification.actionText}
          onClose={() => removeNotification(notification.id)}
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
