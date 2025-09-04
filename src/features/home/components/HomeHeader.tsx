import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { useRouter } from 'expo-router';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import { useAuth } from '../../../context/AuthContext';

const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const HomeHeader: React.FC = () => {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const today = new Date().getDay();

  // Load user profile for avatar/name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/firebaseConfig');
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) setUserProfile(userDoc.data());
      } catch (e) {
        console.error('HomeHeader fetchUserProfile error', e);
      }
    };
    fetchUserProfile();
  }, [user?.uid]);

  // Unread notifications indicator
  useEffect(() => {
    if (!user?.uid) return;
    let unsubscribe: undefined | (() => void);
    const setup = async () => {
      try {
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/firebaseConfig');
        const notificationsRef = collection(db, 'notifications');
        const unreadQuery = query(
          notificationsRef,
          where('userId', '==', user.uid),
          where('isRead', '==', false)
        );
        unsubscribe = onSnapshot(unreadQuery, (snapshot) => setUnreadNotifications(snapshot.size));
      } catch (e) {
        console.error('HomeHeader notifications listen error', e);
      }
    };
    setup();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user?.uid]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(top, 12) }]}>
      <View style={styles.row}>
        <View style={styles.headerLeft}>
          <ProfileAvatar
            imageUrl={
              userProfile?.profileImageUrl ||
              userProfile?.photoURL ||
              userProfile?.avatarUrl ||
              userProfile?.photoUrl ||
              null
            }
            name={userProfile?.name || userProfile?.displayName || 'Profile'}
            size={40}
            textSize={16}
          />
          <Text style={styles.welcome} numberOfLines={1} ellipsizeMode="tail">Welcome, {userProfile?.name || userProfile?.displayName}</Text>
        </View>
        {/* Removed timeline indicator per request */}
        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/notifications')}>
            <View style={styles.notificationContainer}>
              <Ionicons name="notifications-outline" size={22} color={Colors.darkGrey} />
              {unreadNotifications > 0 && <View style={styles.notificationDot} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerButton, { marginLeft: 8 }]} onPress={() => router.push('/(main)/settings')}>
            <Ionicons name="settings-outline" size={22} color={Colors.darkGrey} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors.offWhite,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  welcome: {
    marginLeft:4,
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: Colors.black,
    flexShrink: 1,
    minWidth: 0,
  },
  // Removed timeline indicator styles
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default HomeHeader;
