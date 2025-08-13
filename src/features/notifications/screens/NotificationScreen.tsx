import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';

interface User {
  name: string;
  avatar?: any;
}

interface Notification {
  id: string;
  type: 'recap_love' | 'comment' | 'reminder' | 'streak';
  users?: User[];
  recap?: string;
  comment?: string;
  date: string;
  isRead: boolean;
}
import ReminderNotification from '../components/ReminderNotification';
import StreakNotification from '../components/StreakNotification';
import CommentNotification from '../components/CommentNotification';
import RecapLoveNotification from '../components/RecapLoveNotification';

// NOTE: Using placeholder images. Replace with actual paths or URIs if they differ.
const notificationsData: Notification[] = [
  {
    id: '1',
    type: 'recap_love',
    users: [{ name: 'Susan', avatar: require('@/assets/images/sample.png') }],
    recap: 'Week of July 15th, 2025',
    date: 'July 22, 2025',
    isRead: false,
  },
  {
    id: '2',
    type: 'comment',
    users: [{ name: 'Susan', avatar: require('@/assets/images/sample.png') }],
    comment: '“Wow, look at her go!”',
    date: 'July 16, 2025',
    isRead: false,
  },
  {
    id: '3',
    type: 'comment',
    users: [{ name: 'Sarah', avatar: require('@/assets/images/sample.png') }],
    comment: '“Such a sweet smile! She’s growing so fast”',
    date: 'July 15, 2025',
    isRead: true,
  },
  {
    id: '4',
    type: 'recap_love',
    users: [
      { name: 'Susan', avatar: require('@/assets/images/sample.png') },
      { name: 'Dave', avatar: require('@/assets/images/sample2.png') },
    ],
    recap: 'Week of July 8th, 2025',
    date: 'July 15, 2025',
    isRead: true,
  },
  {
    id: '5',
    type: 'recap_love',
    users: [{ name: 'Sarah', avatar: require('@/assets/images/sample.png') }, { name: 'Dave', avatar: require('@/assets/images/sample2.png') }, { name: 'others' }],
    recap: 'Week of July 1st, 2025',
    date: 'July 8, 2025',
    isRead: true,
  },
  {
    id: '6',
    type: 'reminder',
    date: 'June 30, 2025',
    isRead: true,
  },
  {
    id: '7',
    type: 'streak',
    date: 'June 29, 2025',
    isRead: true,
  },
];

const renderNotificationItem = ({ item }: { item: Notification }) => {
  switch (item.type) {
    case 'recap_love':
      return <RecapLoveNotification item={item} />;
    case 'comment':
      return <CommentNotification item={item} />;
    case 'reminder':
      return <ReminderNotification item={item} />;
    case 'streak':
      return <StreakNotification item={item} />;
    default:
      return null;
  }
};

const NotificationScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Notifications" showBackButton={true} />
      <FlatList
        data={notificationsData}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F4858',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#5D9275',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#A0AEC0',
    marginLeft: 8,
  },
});

export default NotificationScreen;
