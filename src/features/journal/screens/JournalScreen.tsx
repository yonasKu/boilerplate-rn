import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import WeekNavigator from '../components/WeekNavigator';
import { useJournal } from '@/hooks/useJournal';
import JournalEntryCard from '../components/JournalEntryCard';
import JournalFilter from '../components/JournalFilter';
import ActionCallout from '../../../components/ui/ActionCallout';
import AgeFilterModal from '../components/modals/AgeFilterModal';
import { TimelineOption } from '../components/TimelineDropdown';
import ShareBottomSheet from '../components/ShareBottomSheet';
import { Colors } from '@/theme';
import { ProfileAvatar } from '../../../components/ProfileAvatar';

const JournalScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { entries, isLoading, error, updateEntry, deleteEntry, toggleLike } = useJournal();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTimeline, setActiveTimeline] = useState<TimelineOption>('All');
    const [showAgeModal, setShowAgeModal] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

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

    useEffect(() => {
        if (!user?.uid) return;

        const fetchUnreadNotifications = async () => {
            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase/firebaseConfig');
                // Query top-level notifications collection scoped to this user
                const notificationsRef = collection(db, 'notifications');
                const unreadQuery = query(
                    notificationsRef,
                    where('userId', '==', user.uid),
                    where('read', '==', false)
                );
                const querySnapshot = await getDocs(unreadQuery);
                setUnreadNotifications(querySnapshot.size);
            } catch (error) {
                console.error('Error fetching unread notifications:', error);
            }
        };

        fetchUnreadNotifications();

        // Set up real-time listener for unread notifications
        let unsubscribe: (() => void) | undefined;
        
        const setupListener = async () => {
            const { collection, query, where, onSnapshot } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase/firebaseConfig');
            // Real-time listener on top-level notifications for this user
            const notificationsRef = collection(db, 'notifications');
            const unreadQuery = query(
                notificationsRef,
                where('userId', '==', user.uid),
                where('read', '==', false)
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



    const filteredEntries = useMemo(() => {
        let filtered = entries;

        // Filter by timeline (monthly/weekly) - COMMENTED OUT: These filters are for recaps, not journal entries
        /*
        if (activeTimeline !== 'All') {
            const now = new Date();
            
            if (activeTimeline === 'Weekly') {
                // Show entries from the current week (Sunday to Saturday)
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay()); // Get Sunday of current week
                startOfWeek.setHours(0, 0, 0, 0);
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6); // Get Saturday of current week
                endOfWeek.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(entry => {
                    const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);
                    return entryDate >= startOfWeek && entryDate <= endOfWeek;
                });
            } else if (activeTimeline === 'Monthly') {
                // Show entries from the current month
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                startOfMonth.setHours(0, 0, 0, 0);
                
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endOfMonth.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(entry => {
                    const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);
                    return entryDate >= startOfMonth && entryDate <= endOfMonth;
                });
            }
        }
        */

        // Child-based filtering removed: show all user entries regardless of child

        // Filter by search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(entry => 
                entry.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by tags
        if (filterTags.length > 0) {
            filtered = filtered.filter(entry => {
                const entryTags: string[] = [];
                if (entry.isFavorited) entryTags.push('favorite');
                if (entry.isMilestone) entryTags.push('milestone');
                return filterTags.some(tag => entryTags.includes(tag));
            });
        }

        return filtered.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        }, [entries, searchQuery, filterTags, activeTimeline]);

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
                await updateEntry(entryId, { 
                    isMilestone: !entry.isMilestone 
                });
            }
        } catch (error) {
            console.error('Error toggling milestone:', error);
        }
    };

    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEntry, setShareEntry] = useState<any>(null);

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
            // Re-fetch user profile and journal entries
            if (user) {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase/firebaseConfig');
                
                // Refresh user profile
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                }
                
                // Refresh journal entries via useJournal hook
                // The useJournal hook will handle the refresh internally
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
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
        setFilterTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // Resolve user display name and avatar URL (no dropdown)
    const displayName = useMemo(() => (
        userProfile?.name || userProfile?.displayName || user?.displayName || 'Profile'
    ), [userProfile, user]);

    const avatarUrl = useMemo(() => (
        userProfile?.profileImageUrl ||
        (userProfile as any)?.photoURL ||
        (userProfile as any)?.avatarUrl ||
        (userProfile as any)?.photoUrl ||
        null
    ), [userProfile]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <ProfileAvatar
                            imageUrl={avatarUrl}
                            name={displayName}
                            size={40}
                            textSize={16}
                        />
                        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                            {displayName}
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
            {entries.length > 0 && <WeekNavigator />}
            {entries.length > 0 && (
                <JournalFilter 
                    onAgePress={() => setShowAgeModal(true)} 
                    //activeTimeline={activeTimeline}
                    //onTimelineChange={setActiveTimeline}
                    onFilterChange={(filter) => {
                        if (filter === 'All') {
                            setFilterTags([]);
                        } else if (filter === 'Favorites') {
                            setFilterTags(['favorite']);
                        } else if (filter === 'Milestones') {
                            setFilterTags(['milestone']);
                        }
                    }}
                    activeFilter={filterTags.length === 0 ? 'All' : 
                        filterTags.includes('favorite') ? 'Favorites' : 
                        filterTags.includes('milestone') ? 'Milestones' : 'All'}
                />
            )}
            
            <AgeFilterModal
                visible={showAgeModal}
                onClose={() => setShowAgeModal(false)}
                                onSave={(ageRange) => {
                    console.log('Age filter applied:', ageRange);
                                        setShowAgeModal(false);
                }}
            />

            <ShareBottomSheet
                isVisible={showShareModal}
                onClose={() => setShowShareModal(false)}
                onShare={handleShareAction}
            />

                        
            
            {isLoading ? (
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : error ? (
                <View style={styles.centeredContent}>
                    <Image source={require('../../../assets/images/Logo_Icon.png')} style={styles.mainImage} />
                    <Text style={styles.promptText}>Something went wrong</Text>
                    <Text style={[styles.promptText, { fontSize: 14, color: Colors.error, marginTop: 8 }]}>
                        {error}
                    </Text>
                </View>
            ) : filteredEntries.length === 0 ? (
                entries.length === 0 ? (
                    <View style={styles.emptyCalloutContainer}>
                        <ActionCallout
                            title="Start your journal"
                            description="Take 30 seconds now to create memories for a lifetime."
                            ctaLabel="Add first memory"
                            onPress={() => router.push('/(main)/new-entry')}
                            dateBadge={new Date()}
                            backgroundColor={Colors.lightPink2}
                        />
                    </View>
                ) : (
                    <View style={styles.centeredContent}>
                        <Image source={require('../../../assets/images/Logo_Icon.png')} style={styles.mainImage} />
                        <Text style={styles.promptText}>No entries match your filters</Text>
                    </View>
                )
            ) : (
                <FlatList
                    data={filteredEntries}
                    renderItem={({ item }) => (
                        <JournalEntryCard 
                            entry={item} 
                            selectedChildId={''}
                            onPress={() => router.push(`/journal/${item.id}` as any)}
                            onLike={() => handleLike(item.id)}
                            onShare={() => handleShare(item)}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item)}
                            onToggleMilestone={() => handleToggleMilestone(item.id)}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContentContainer}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    dropdownInlineContainer: {
        marginTop: 8,
        marginHorizontal: 16,
        backgroundColor: Colors.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        maxHeight: 280,
    },
    dropdownContainer: {
        position: 'absolute',
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: Colors.lightGrey,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        zIndex: 1000,
        maxHeight: 280,
    },
    dropdownBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 900,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    dropdownItemSelected: {
        backgroundColor: Colors.accent,
    },
    dropdownItemText: {
        fontSize: 16,
        color: Colors.black,
    },
    dropdownItemTextActive: {
        color: Colors.black,
        fontWeight: 'bold',
    },
    dropdownItemTextInactive: {
        color: Colors.mediumGrey,
        fontWeight: '400',
    },
    separator: {
        height: 1,
        backgroundColor: Colors.offWhite,
        marginHorizontal: 16,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.offWhite,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.offWhite,
        gap: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 1, // Allow this container to shrink
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
        //flex: 1, // Allow the title to take available space and shrink
        flexShrink: 1,
        marginHorizontal:6  
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerButton: {
        padding :4,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.white,
        paddingTop: 0, // Remove top padding to center properly
    },
    emptyCalloutContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: Colors.offWhite,
        flex: 1,
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100, // Ensure space for floating action button if any
    },
    mainImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 16, // Add spacing below logo
    },
    promptText: {
        marginTop: 24,
        fontSize: 16,
        color: Colors.darkGrey,
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGrey,
    },
    searchInput: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        marginBottom: 12,
    },
    filterTags: {
        flexDirection: 'row',
        gap: 8,
    },
    tagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        backgroundColor: Colors.white,
    },
    activeTag: {
        backgroundColor: Colors.accent,
        borderColor: Colors.primary,
    },
    tagText: {
        fontSize: 12,
        color: Colors.mediumGrey,
    },
    activeTagText: {
        color: '#fff',
        fontWeight: '600',
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
    notificationBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FF3B30',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1,
        borderColor: '#fff',
    },
    notificationCount: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        lineHeight: 12,
    },
});

export default JournalScreen;
