import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAuth } from '../../../context/AuthContext';
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface User {
  name: string;
  avatar?: any;
}

interface NotificationItem {
  id: string;
  type: 'recap_love' | 'comment' | 'reminder' | 'streak' | 'recap_ready';
  users?: User[];
  recap?: string;
  comment?: string;
  body?: string;
  title?: string;
  childId?: string;
  recapId?: string;
  recapType?: string;
  date: string;
  isRead: boolean;
  createdAt: any;
}
import ReminderNotification from '../components/ReminderNotification';
import StreakNotification from '../components/StreakNotification';
import CommentNotification from '../components/CommentNotification';
import RecapLoveNotification from '../components/RecapLoveNotification';

const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
  switch (item.type) {
    case 'recap_love':
      return <RecapLoveNotification item={item} />;
    case 'comment':
      return <CommentNotification item={item} />;
    case 'reminder':
      return <ReminderNotification item={item} />;
    case 'streak':
      return <StreakNotification item={item} />;
    case 'recap_ready':
      return <ReminderNotification item={item} />;
    default:
      return null;
  }
};

const NotificationScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore();
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData: NotificationItem[] = [];
      console.log('📱 Notifications loaded:', snapshot.size, 'notifications');
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔔 Notification:', {
          id: doc.id,
          type: data.type,
          title: data.title,
          body: data.body,
          date: data.date
        });
        notificationsData.push({
          id: doc.id,
          type: data.type || 'comment',
          users: data.users || [],
          recap: data.recap,
          comment: data.comment,
          body: data.body,
          title: data.title,
          date: data.date || new Date(data.createdAt?.toDate()).toLocaleDateString(),
          isRead: data.isRead || false,
          createdAt: data.createdAt,
        });
      });
      console.log('📋 Processed notifications:', notificationsData);
      setNotifications(notificationsData);
      setLoading(false);
    }, (error) => {
      console.error('❌ Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader title="Notifications" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Notifications" showBackButton={true} />
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGrey,
    fontFamily: 'Poppins-Regular',
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
