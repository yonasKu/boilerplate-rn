import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AvatarCluster from '@/features/notifications/components/AvatarCluster';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import RecapLoveNotification from '@/features/notifications/components/RecapLoveNotification';
import CommentNotification from '@/features/notifications/components/CommentNotification';

const RecentActivityCard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const db = getFirestore();
    const ref = collection(db, 'notifications');
    const q = query(ref, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setItems(list);
    });
    return () => unsub();
  }, [user?.uid]);

  const latest = useMemo(() => {
    if (!items || items.length === 0) return undefined;
    const reaction = items.find((n: any) => n?.type === 'recap_love' || n?.type === 'recap_like' || n?.type === 'recap_comment' || n?.type === 'comment');
    // Only show a real notification on this card if it's a reaction/comment.
    // Otherwise, keep showing the original hardcoded example.
    return reaction || undefined;
  }, [items]);

  // Normalize type and date like NotificationScreen
  const displayItem = useMemo(() => {
    if (!latest) return undefined;
    const rawType = (latest.type as string) || 'comment';
    const normalizedType =
      rawType === 'reccap_like' || rawType === 'recap_like'
        ? 'recap_love'
        : rawType === 'recap_comment'
        ? 'comment'
        : (['recap_love', 'comment', 'reminder', 'streak', 'recap_ready'] as string[]).includes(rawType)
        ? (rawType as any)
        : 'comment';
    const createdAt: any = (latest as any).createdAt;
    const dateStr = (latest as any).date || (createdAt?.toDate ? new Date(createdAt.toDate()).toLocaleDateString() : '');
    return { ...(latest as any), type: normalizedType, date: dateStr } as any;
  }, [latest]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.leftIconWrap}>
            <Ionicons name="notifications-outline" size={22} color={Colors.darkGrey} />
          </View>
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(main)/notifications')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {displayItem ? (
        <View>
          {displayItem.type === 'recap_love' ? (
            <RecapLoveNotification item={displayItem as any} />
          ) : (
            <CommentNotification item={displayItem as any} />
          )}
        </View>
      ) : (
        <View style={styles.contentRow}>
          <View style={styles.avatarContainer}>
            <AvatarCluster users={[{ name: 'Jane Doe' }, { name: 'Alex' }]} colors={["#D9D9D9", "#FFD8CD"]} />
            <View style={styles.heartIconContainerCluster}>
              <Ionicons name="heart" size={16} color={'#F68B7F'} />
            </View>
          </View>
          <Text style={styles.subtitle}>When loved ones comment on and favorite your recaps, you'll see that activity here.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.offWhite,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leftIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: Colors.darkGrey,
  },
  viewAll: {
    color: Colors.primary,
    fontFamily: 'Poppins_400Regular',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 58, // matches AvatarCluster container width
    height: 40,
    position: 'relative',
    justifyContent: 'center',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.offWhite,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heartIconContainerCluster: {
    position: 'absolute',
    bottom: -8,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    //padding: 2,
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  heartIconContainerSingle: {
    position: 'absolute',
    bottom: -8,
    right: -6,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  subtitle: {
    marginTop: 4,
    flex: 1,
    color: Colors.darkGrey,
    fontSize: 12,
    paddingHorizontal: 8,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
});

export default RecentActivityCard;
