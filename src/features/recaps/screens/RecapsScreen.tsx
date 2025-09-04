import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, FlatList, Alert, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { ProfileAvatar } from '@/components/ProfileAvatar';

import { RecapCard } from '../components/RecapCard';
import ShareBottomSheet from '../../journal/components/ShareBottomSheet';
import FilterTabs from '../components/FilterTabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRecaps } from '../hooks/useRecaps';
import { Recap } from '../../../services/aiRecapService';
import { TimelineOption } from '../components/TimelineDropdown';
import WeeklyRecapPreviewCard from '@/features/home/components/WeeklyRecapPreviewCard';
import ShareWithLovedOnesCard from '@/features/home/components/ShareWithLovedOnesCard';

const RecapsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [isShareSheetVisible, setShareSheetVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTimeline, setActiveTimeline] = useState<TimelineOption>('All');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { recaps: rawRecaps, loading } = useRecaps();
  const hasAnyRecap = (rawRecaps || []).length > 0;

  // Fetch user profile and children
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/firebaseConfig');
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) setUserProfile(userDoc.data());
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, [user?.uid]);

  // Live unread notifications indicator
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
        console.error('RecapsScreen notifications listen error', e);
      }
    };
    setup();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user?.uid]);

  const toJsDate = (v: any | undefined | null): Date | null => {
    if (!v) return null;
    const d = v?.toDate ? v.toDate() : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const filteredRecaps = React.useMemo(() => {
    // Exclude user-scoped weekly_snippet from Recaps by default
    let filtered = rawRecaps.filter(recap => recap.id && (recap as any).type !== 'weekly_snippet');

    // Apply timeline filter
    if (activeTimeline !== 'All') {
      filtered = filtered.filter(recap => recap.type === activeTimeline.toLowerCase());
    }

    // Apply other filters
    switch (activeFilter) {
      case 'Favorites':
        filtered = filtered.filter(recap => recap.isFavorited === true);
        break;
      case 'Milestones':
        filtered = filtered.filter(recap => recap.isMilestone === true);
        break;
      case 'Date':
        // If a date is selected, include recaps whose period includes that date
        if (selectedDate) {
          filtered = filtered.filter((recap) => {
            const start = toJsDate((recap as any).period?.startDate);
            const end = toJsDate((recap as any).period?.endDate);
            if (!start || !end) return false;
            const d = selectedDate;
            const ds = new Date(start); ds.setHours(0,0,0,0);
            const de = new Date(end); de.setHours(23,59,59,999);
            return d >= ds && d <= de;
          });
        }
        break;
    }
    
    return filtered;
  }, [rawRecaps, activeTimeline, activeFilter, selectedDate]);

  // Use saved journal name for the header title
  const journalTitle = React.useMemo(() => {
    const raw = (userProfile as any)?.journalName;
    if (typeof raw === 'string') {
      const t = raw.trim();
      return t.length > 0 ? t : 'My Journal';
    }
    return 'My Journal';
  }, [userProfile]);

  const handleSharePress = () => {
    setShareSheetVisible(true);
  };

  const handleShareOption = (platform: 'copy' | 'system') => {
    setShareSheetVisible(false);
    Alert.alert('Sharing', `Shared via ${platform}`);
    // Implement actual sharing logic here
  };

  if (loading || loadingProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading recaps...</Text>
      </View>
    );
  }

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (_event: any, date?: Date) => {
    // On Android, user can dismiss; only proceed if date is set
    if (date) {
      setSelectedDate(date);
      setActiveFilter('Date');
    }
    // Hide picker on Android after selection; keep visible on iOS (inline)
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.headerContainer}>
        <View style={styles.header}>
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
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {journalTitle}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/notifications')}>
              <View style={styles.notificationContainer}>
                <Ionicons name="notifications-outline" size={22} color="#2F4858" />
                {unreadNotifications > 0 && (
                  <View style={styles.notificationDot} />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/settings')}>
              <Ionicons name="settings-outline" size={22} color="#2F4858" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {hasAnyRecap ? (
        <>
          <FilterTabs
            onDatePress={handleDatePress}
            onFilterChange={setActiveFilter}
            activeFilter={activeFilter}
            onTimelineChange={setActiveTimeline}
            activeTimeline={activeTimeline}
          />
          <FlatList
            data={filteredRecaps}
            renderItem={({ item }) => (
              <View style={styles.cardContainer}>
                <RecapCard recap={item as Recap} onShare={handleSharePress} />
              </View>
            )}
            keyExtractor={(item) => item.id!}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 12 }}>
          <WeeklyRecapPreviewCard />
          <ShareWithLovedOnesCard />
        </View>
      )}
      <ShareBottomSheet 
        isVisible={isShareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        onShare={handleShareOption}
      />

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: Colors.blacktext,
    marginRight: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  cardContainer: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGrey,
  },
});

export default RecapsScreen;
