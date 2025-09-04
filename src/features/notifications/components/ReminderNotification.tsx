import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import NotificationService from '@/services/notifications/NotificationService';

interface Notification {
  id: string;
  type: 'recap_love' | 'comment' | 'reminder' | 'streak' | 'recap_ready';
  date: string;
  isRead: boolean;
  title?: string;
  body?: string;
}

const ReminderNotification = ({ item }: { item: Notification }) => {
  const iconContainerStyle = [styles.iconContainer, { backgroundColor: item.isRead ? Colors.offWhite : Colors.lightPink }];

  const handlePress = React.useCallback(() => {
    if (!item.isRead) {
      NotificationService.markNotificationAsRead(item.id).catch((e) =>
        console.error('Failed to mark notification as read:', e)
      );
    }
  }, [item.id, item.isRead]);

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={handlePress}>
      <View style={iconContainerStyle}>
        <Ionicons name="notifications-outline" size={24} color={Colors.darkGrey} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.body}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkGrey,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  text: {
    fontSize: 15,
    color: Colors.darkGrey,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  date: {
    fontSize: 13,
    color: Colors.mediumGrey,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});

export default ReminderNotification;
