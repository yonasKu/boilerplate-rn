import { useNotification } from '../../../hooks/useNotification';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';


export default function NotificationTestScreen() {
  const { showNotification, simulatePushNotification } = useNotification();

  const testNotifications = () => {
    console.log('🔔 TEST: Attempting to show success notification');
    showNotification({
      title: 'TEST: Weekly Recap Ready',
      message: 'Your weekly journal recap is ready to view and share',
      type: 'success',
      actionText: 'View Recap',
      actionUrl: '/recaps',
      data: { persistent: true }
    });
    console.log('🔔 TEST: Success notification triggered');
  };

  const testErrorNotification = () => {
    console.log('🔔 TEST: Attempting to show error notification');
    showNotification({
      title: 'TEST: Save Failed',
      message: 'Failed to save journal entry. Please try again.',
      type: 'error',
      actionText: 'Retry',
      data: { persistent: true }
    });
    console.log('🔔 TEST: Error notification triggered');
  };

  const testInfoNotification = () => {
    console.log('🔔 TEST: Attempting to show info notification');
    showNotification({
      title: 'TEST: Reminder',
      message: 'Don\'t forget to add today\'s journal entry',
      type: 'info',
      actionText: 'Add Entry',
      data: { persistent: true }
    });
    console.log('🔔 TEST: Info notification triggered');
  };

  const testWarningNotification = () => {
    console.log('🔔 TEST: Attempting to show warning notification');
    showNotification({
      title: 'TEST: Storage Low',
      message: 'Your device storage is running low. Consider backing up old entries.',
      type: 'warning',
      actionText: 'Manage Storage',
      data: { persistent: true }
    });
    console.log('🔔 TEST: Warning notification triggered');
  };

  const testPushSimulation = () => {
    console.log('🔔 TEST: Attempting to show push notification simulation');
    simulatePushNotification({
      title: 'TEST: Push Notification',
      message: 'This simulates a push notification converted to in-app',
      type: 'success',
      actionText: 'View Details',
      actionUrl: '/journal'
    });
    console.log('🔔 TEST: Push notification simulation triggered');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Notification System Test</Text>
        <Text style={styles.subtitle}>Tap buttons to test different notification types</Text>
        <Text style={styles.debugText}>Check console for logs when pressing buttons</Text>
        
        <TouchableOpacity style={[styles.button, styles.successButton]} onPress={testNotifications}>
          <Text style={styles.buttonText}>Test Success Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={testErrorNotification}>
          <Text style={styles.buttonText}>Test Error Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={testInfoNotification}>
          <Text style={styles.buttonText}>Test Info Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={testWarningNotification}>
          <Text style={styles.buttonText}>Test Warning Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.pushButton]} onPress={testPushSimulation}>
          <Text style={styles.buttonText}>Test Push Notification</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
  },
  infoButton: {
    backgroundColor: '#007AFF',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  pushButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
});
