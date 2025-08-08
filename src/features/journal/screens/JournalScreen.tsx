import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, TextInput, Share, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import WeekNavigator from '../components/WeekNavigator';
import { useJournal } from '@/hooks/useJournal';
import JournalEntryCard from '../components/JournalEntryCard';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import JournalFilter from '../components/JournalFilter';
import AgeFilterModal from '../components/modals/AgeFilterModal';


interface Child {
  id: string;
  name: string;
  profileImageUrl?: string;
}

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
        const [showAgeModal, setShowAgeModal] = useState(false);
    const [showChildDropdown, setShowChildDropdown] = useState(false);
    const [headerLeftLayout, setHeaderLeftLayout] = useState<{ x: number; y: number; width: number; height: number }>({ x: 16, y: 0, width: 200, height: 48 });
    const [children, setChildren] = useState<any[]>([]);
        const [selectedChild, setSelectedChild] = useState<Child | null>(null); // null means 'All Children'

    // Fetch actual user profile from Firestore
        useEffect(() => {
        const fetchChildren = async () => {
            if (user) {
                try {
                    const { collection, query, where, getDocs } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase/firebaseConfig');
                    const childrenQuery = query(collection(db, 'children'), where('parentId', '==', user.uid));
                    const querySnapshot = await getDocs(childrenQuery);
                    const childrenData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setChildren(childrenData);
                } catch (err) {
                    console.error('Error fetching children:', err);
                }
            }
        };
        fetchChildren();
    }, [user]);

    // Helpers: ensure consistent avatar/name resolution
    const getItemName = (item: any | null) => {
        if (!item) return 'Journals';
        return item.name || item.displayName || 'Unnamed';
    };

    const getItemAvatar = (item: any | null) => {
        if (!item) return userProfile?.profileImageUrl || userProfile?.photoURL || userProfile?.avatarUrl || null;
        return (
            item.profileImageUrl ||
            item.photoURL ||
            item.photoUrl ||
            item.avatarUrl ||
            item.avatar ||
            null
        );
    };

    useEffect(() => {
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

        fetchUserProfile();
    }, [user]);

            const filteredEntries = useMemo(() => {
        let filtered = entries;

        // Filter by selected child
        if (selectedChild) {
            filtered = filtered.filter(entry => entry.childId === selectedChild.id);
        }

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
        }, [entries, selectedChild, searchQuery, filterTags]);

    const handleLike = async (entryId: string) => {
        try {
            await toggleLike(entryId);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleShare = async (entry: any) => {
        try {
            await Share.share({
                message: `Check out this memory from SproutBook: ${entry.text}`,
                // You can also add a URL to share, e.g., a web link to the entry
            });
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

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
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
                            <Ionicons name="notifications-outline" size={24} color="#2F4858" />
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
                        { top: headerLeftLayout.y + headerLeftLayout.height, left: headerLeftLayout.x, width: headerLeftLayout.width },
                    ]}>
                        <FlatList
                            keyboardShouldPersistTaps="handled"
                            data={[null, ...children].filter(item => item?.id !== selectedChild?.id)}
                            keyExtractor={(item) => item?.id || 'all-journals'}
                            renderItem={({ item }) => {
                                const isSelected = (item === null && selectedChild === null) || (item?.id === selectedChild?.id);
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
            <WeekNavigator />
            <JournalFilter 
                onAgePress={() => setShowAgeModal(true)} 
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
            
            <AgeFilterModal
                visible={showAgeModal}
                onClose={() => setShowAgeModal(false)}
                                onSave={(ageRange) => {
                    console.log('Age filter applied:', ageRange);
                                        setShowAgeModal(false);
                }}
            />

                        
            
            {isLoading ? (
                <View style={styles.centeredContent}>
                    <ActivityIndicator size="large" color="#5D9278" />
                </View>
            ) : error ? (
                <View style={styles.centeredContent}>
                    <Image source={require('../../../assets/images/leaf_home.png')} style={styles.mainImage} />
                    <Text style={styles.promptText}>
                        {searchQuery || filterTags.length > 0 ? 'No entries match your filters' : "Let's start your first memory"}
                    </Text>
                    <Text style={[styles.promptText, { fontSize: 14, color: '#FF6B6B', marginTop: 8 }]}>
                        {error}
                    </Text>
                </View>
            ) : filteredEntries.length === 0 ? (
                <View style={styles.centeredContent}>
                    <Image source={require('../../../assets/images/leaf_home.png')} style={styles.mainImage} />
                    <Text style={styles.promptText}>
                        {searchQuery || filterTags.length > 0 ? 'No entries match your filters' : "Let's start your first memory"}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredEntries}
                    renderItem={({ item }) => (
                        <JournalEntryCard 
                            entry={item} 
                            onLike={() => handleLike(item.id)}
                            onShare ={() => handleShare(item)}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item)}
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
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        maxHeight: 280,
    },
    dropdownContainer: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#EEF2F3',
        shadowColor: '#000',
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
        backgroundColor: '#EAF3F0',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#2F4858',
    },
    dropdownItemTextActive: {
        color: '#2F4858',
        fontWeight: 'bold',
    },
    dropdownItemTextInactive: {
        color: '#6B7C85',
        fontWeight: '400',
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 16,
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
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
        color: '#2F4858',
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
        padding: 4,
    },
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 100, // Ensure space for floating action button if any
    },
    mainImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    promptText: {
        marginTop: 24,
        fontSize: 16,
        color: '#A9A9A9',
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F8F8',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
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
        borderColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    activeTag: {
        backgroundColor: '#EAF3F0',
        borderColor: '#5D9275',
    },
    tagText: {
        fontSize: 12,
        color: '#666',
    },
    activeTagText: {
        color: '#5D9275',
        fontWeight: '500',
    },
});

export default JournalScreen;

