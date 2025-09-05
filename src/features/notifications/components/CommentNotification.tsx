import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@/theme';
import NotificationService from '@/services/notifications/NotificationService';
import { router } from 'expo-router';

interface User {
  name: string;
  avatar?: any;
}

interface Notification {
  id: string;
  type: 'recap_love' | 'comment' | 'reminder' | 'streak' | 'recap_ready';
  users?: User[];
  recap?: string;
  recapId?: string;
  comment?: string;
  body?: string;
  title?: string;
  date: string;
  isRead: boolean;
}

const CommentNotification = ({ item }: { item: Notification }) => {
  const userNames = item.users?.map(u => u.name).join(', ').replace(/,([^,]*)$/, ' and$1');

  const handlePress = React.useCallback(() => {
    if (!item.isRead) {
      NotificationService.markNotificationAsRead(item.id).catch((e) =>
        console.error('Failed to mark notification as read:', e)
      );
    }
    const id = item.recapId || item.recap;
    if (id) {
      try {
        router.push({ pathname: '/(main)/recaps/recap-view', params: { recapId: String(id), openComments: 'true' } });
      } catch (e) {
        console.warn('Navigation error from CommentNotification:', e);
      }
    }
  }, [item.id, item.isRead]);

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={handlePress}>
        {item.users && item.users[0]?.avatar && (
            <Image source={item.users[0].avatar} style={styles.avatar} />
        )}
      <View style={styles.textContainer}>
        <Text style={styles.text}>
          <Text style={styles.bold}>{userNames}</Text> commented: {item.comment}
        </Text>
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  text: {
    fontSize: 15,
    color: Colors.darkGrey,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  bold: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  date: {
    fontSize: 13,
    color: Colors.mediumGrey,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});

export default CommentNotification;
