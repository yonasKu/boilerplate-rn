import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, FlatList, Alert, Text, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { getInitials, generateAvatarColor } from '@/utils/avatarUtils';

import { RecapCard } from '../components/RecapCard';
import ShareBottomSheet from '../../journal/components/ShareBottomSheet';
import FilterTabs from '../components/FilterTabs';
import { useRecaps } from '../hooks/useRecaps';
import { Recap } from '../../../services/aiRecapService';
import { TimelineOption } from '../components/TimelineDropdown';

interface Child {
  id: string;
  name: string;
  profileImageUrl?: string;
}

const RecapsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [isShareSheetVisible, setShareSheetVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTimeline, setActiveTimeline] = useState<TimelineOption>('All');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [headerLeftLayout, setHeaderLeftLayout] = useState<{ x: number; y: number; width: number; height: number }>({ x: 16, y: 0, width: 200, height: 48 });
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const { recaps: rawRecaps, loading } = useRecaps();

  // Helper functions for child selection
  const getItemName = (item: Child | null) => {
    if (!item) return 'Loading...';
    return item.name || 'User';
  };

  const getItemAvatar = (item: Child | null) => {
    if (!item) return '';
    return item.profileImageUrl || '';
  };

  // Fetch user profile and children
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/firebaseConfig');
          
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data:', userData);
            setUserProfile(userData);
            
            // Handle children data - fetch actual child documents
            let childrenData: Child[] = [];
            if (Array.isArray(userData.children)) {
              // Children are stored as IDs, fetch each child document
              const { doc, getDoc } = await import('firebase/firestore');
              const { db } = await import('@/lib/firebase/firebaseConfig');
              
              const childPromises = userData.children.map(async (childId: string) => {
                try {
                  const childDocRef = doc(db, 'children', childId);
                  const childDoc = await getDoc(childDocRef);
                  if (childDoc.exists()) {
                    const childData = childDoc.data();
                    return {
                      id: childId,
                      name: childData.name || 'Child',
                      profileImageUrl: childData.profileImageUrl || '',
                      dateOfBirth: childData.dateOfBirth || '',
                      gender: childData.gender || ''
                    } as Child;
                  }
                  return null;
                } catch (error) {
                  console.error('Error fetching child:', childId, error);
                  return null;
                }
              });
              
              const fetchedChildren = await Promise.all(childPromises);
              childrenData = fetchedChildren.filter((child): child is Child => child !== null);
            } else if (userData.children && typeof userData.children === 'object') {
              // Handle case where children are stored as objects - skip this branch for now
              // since children are stored as array of IDs
              childrenData = [];
            }
            console.log('Processed children data:', childrenData);
            setChildren(childrenData);
            
            // Set selected child to first child or user profile
            if (childrenData.length > 0) {
              setSelectedChild(childrenData[0]);
            } else {
              setSelectedChild({
                id: user.uid,
                name: userData.name || 'User',
                profileImageUrl: userData.profileImageUrl || ''
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoadingProfile(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch unread notifications count - skip if permissions issue
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase/firebaseConfig');
          
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
          );
          const snapshot = await getDocs(notificationsQuery);
          setUnreadNotifications(snapshot.size);
        } catch (error) {
          console.warn('Notification permissions issue, skipping notifications:', error);
          setUnreadNotifications(0); // Default to 0 if permissions issue
        }
      }
    };

    // Only fetch notifications if user exists
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const filteredRecaps = React.useMemo(() => {
    let filtered = rawRecaps.filter(recap => recap.id);

    // Filter by selected child
    if (selectedChild && String(selectedChild) !== 'all') {
      const childId = typeof selectedChild === 'string' ? selectedChild : 
                    (typeof selectedChild === 'object' && selectedChild !== null ? 
                     (selectedChild as any).id : String(selectedChild));
      
      filtered = filtered.filter(recap => {
        const recapChildId = (recap as any).childId;
        const recapChildIds = (recap as any).childIds;
        
        const matches = recapChildId === childId || 
          (Array.isArray(recapChildIds) && recapChildIds.includes(childId));
        return matches;
      });
    }

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
      case 'Age':
        // Age filtering will be handled by Age filter modal
        break;
    }
    
    return filtered;
  }, [rawRecaps, activeTimeline, activeFilter, selectedChild]);

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

  const handleAgePress = () => {
    // Implement age filter modal here
    console.log('Age filter pressed');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => setShowChildDropdown((v) => !v)}
            activeOpacity={0.7}
            onLayout={(e) => setHeaderLeftLayout(e.nativeEvent.layout)}
          >
            <ProfileAvatar
              imageUrl={getItemAvatar(selectedChild)}
              name={getItemName(selectedChild)}
              size={40}
              textSize={16}
            />
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {getItemName(selectedChild)}
            </Text>
            <Ionicons name={showChildDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#2F4858" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/notifications')}>
              <View style={styles.notificationContainer}>
                <Ionicons name="notifications-outline" size={24} color="#2F4858" />
                {/* {unreadNotifications > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationCount}>
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Text>
                  </View>
                )} */}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/settings')}>
              <Ionicons name="settings-outline" size={24} color="#2F4858" />
            </TouchableOpacity>
          </View>
        </View>
        {showChildDropdown && (
          <Pressable
            style={styles.dropdownBackdrop}
            onPress={() => setShowChildDropdown(false)}
            android_ripple={{ color: 'transparent' }}
          />
        )}
        {showChildDropdown && (
          <View style={[
            styles.dropdownContainer,
            { top: headerLeftLayout.y + headerLeftLayout.height + 8, left: headerLeftLayout.x, width: headerLeftLayout.width },
          ]}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={children.filter(item => item?.id !== selectedChild?.id)}
              keyExtractor={(item) => item?.id}
              renderItem={({ item }) => {
                const isSelected = item?.id === selectedChild?.id;
                const name = getItemName(item);
                const imageUrl = getItemAvatar(item);
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                    onPress={() => {
                      setSelectedChild(item);
                      setShowChildDropdown(false);
                    }}
                  >
                    <ProfileAvatar imageUrl={imageUrl} name={name} size={30} textSize={14} />
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isSelected ? styles.dropdownItemTextActive : styles.dropdownItemTextInactive,
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        )}
      </View>
      <FilterTabs
        onAgePress={handleAgePress}
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
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recaps found</Text>
          </View>
        }
      />
      <ShareBottomSheet 
        isVisible={isShareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        onShare={handleShareOption}
      />
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.blacktext,
    marginRight: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 250,
    zIndex: 1000,
    marginTop: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.primary + '20',
  },
  dropdownItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: Colors.blacktext,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  dropdownItemTextInactive: {
    color: Colors.blacktext,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
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
