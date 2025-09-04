// src/hooks/useJournalScreen.ts
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useJournal } from '@/hooks/useJournal';

export const useJournalScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const {
    entries,
    isLoading,
    error,
    updateEntry,
    deleteEntry,
    toggleLike,
    refreshEntries,
  } = useJournal();

  // Local UI state centralized here
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Share UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEntry, setShareEntry] = useState<any>(null);

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (user) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/firebaseConfig');

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
        setLoadingProfile(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoadingProfile(false);
      }
    } else {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // Fetch unread notifications + realtime listener
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUnreadNotifications = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/firebaseConfig');
        const notificationsRef = collection(db, 'notifications');
        const unreadQuery = query(
          notificationsRef,
          where('userId', '==', user.uid),
          where('isRead', '==', false)
        );
        const querySnapshot = await getDocs(unreadQuery);
        setUnreadNotifications(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      }
    };

    fetchUnreadNotifications();

    let unsubscribe: (() => void) | undefined;
    const setupListener = async () => {
      const { collection, query, where, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/firebaseConfig');
      const notificationsRef = collection(db, 'notifications');
      const unreadQuery = query(
        notificationsRef,
        where('userId', '==', user.uid),
        where('isRead', '==', false)
      );

      unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
        setUnreadNotifications(snapshot.size);
      });
    };

    setupListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (searchQuery.trim()) {
      filtered = filtered.filter(entry =>
        entry.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterTags.length > 0) {
      filtered = filtered.filter(entry => {
        const entryTags: string[] = [];
        if (entry.isFavorited) entryTags.push('favorite');
        if (entry.isMilestone) entryTags.push('milestone');
        return filterTags.some(tag => entryTags.includes(tag));
      });
    }

    if (selectedDate) {
      const ds = new Date(selectedDate); ds.setHours(0, 0, 0, 0);
      const de = new Date(selectedDate); de.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => {
        const dtRaw = (entry as any).occurredAt || entry.createdAt;
        const dt = dtRaw?.toDate ? dtRaw.toDate() : new Date(dtRaw);
        if (Number.isNaN(dt.getTime())) return false;
        return dt >= ds && dt <= de;
      });
    }

    return filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [entries, searchQuery, filterTags, selectedDate]);

  // Handlers centralized
  const handleLike = async (entryId: string) => {
    try {
      await toggleLike(entryId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleMilestone = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        await updateEntry(entryId, { isMilestone: !entry.isMilestone });
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
    }
  };

  const handleShare = (entry: any) => {
    setShareEntry(entry);
    setShowShareModal(true);
  };

  const handleShareAction = async (platform: 'copy' | 'system') => {
    if (!shareEntry) return;
    try {
      const message = `Check out this memory from SproutBook: ${shareEntry.text || ''}`;
      if (platform === 'copy') {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied to clipboard');
      } else {
        const { Share } = await import('react-native');
        await Share.share({ message });
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing entry:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user) {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/firebaseConfig');
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) setUserProfile(userDoc.data());
        await refreshEntries();
      }
    } catch (e) {
      console.error('Error refreshing data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = (entry: any) => {
    router.push(`/(main)/new-entry?entryId=${entry.id}` as any);
  };

  const handleDelete = async (entry: any) => {
    try {
      const mediaUrls = entry.media?.map((m: any) => m.url) || [];
      await deleteEntry(entry.id, mediaUrls);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  // Derived UI values
  const displayName = useMemo(
    () => userProfile?.name || userProfile?.displayName || user?.displayName || 'Profile',
    [userProfile, user]
  );

  const avatarUrl = useMemo(
    () =>
      userProfile?.profileImageUrl ||
      (userProfile as any)?.photoURL ||
      (userProfile as any)?.avatarUrl ||
      (userProfile as any)?.photoUrl ||
      null,
    [userProfile]
  );

  const journalTitle = useMemo(() => {
    const raw = (userProfile as any)?.journalName;
    if (typeof raw === 'string') {
      const t = raw.trim();
      return t.length > 0 ? t : 'My Journal';
    }
    return 'My Journal';
  }, [userProfile]);

  return {
    // Data
    entries,
    isLoading,
    error,
    filteredEntries,

    // Profile / notifications
    userProfile,
    loadingProfile,
    unreadNotifications,

    // Filters / search / date
    searchQuery,
    setSearchQuery,
    filterTags,
    setFilterTags,
    showFilters,
    setShowFilters,
    selectedDate,
    setSelectedDate,
    showDatePicker,
    setShowDatePicker,

    // Refresh state
    refreshing,
    onRefresh,
    refreshEntries,

    // Share state & handlers
    showShareModal,
    setShowShareModal,
    shareEntry,
    handleShare,
    handleShareAction,

    // Entry handlers
    handleLike,
    handleToggleMilestone,
    handleEdit,
    handleDelete,

    // Derived UI values
    displayName,
    avatarUrl,
    journalTitle,
  };
};
