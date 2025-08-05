import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import WeekNavigator from '../components/WeekNavigator';
import { useJournal } from '@/hooks/useJournal';
import JournalEntryCard from '../components/JournalEntryCard';
import { ProfileAvatar } from '../../../components/ProfileAvatar';

const JournalScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { entries, isLoading, error, updateEntry, deleteEntry, toggleLike } = useJournal();
    const [isWeekNavigatorVisible, setIsWeekNavigatorVisible] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch actual user profile from Firestore
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
    }, [entries, searchQuery, filterTags]);

    const handleLike = async (entryId: string) => {
        try {
            await toggleLike(entryId);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleEdit = (entry: any) => {
        router.push(`/(main)/journal/edit-entry?entryId=${entry.id}` as any);
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
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerLeft} onPress={() => setIsWeekNavigatorVisible(!isWeekNavigatorVisible)}>
                    <ProfileAvatar
                        imageUrl={userProfile?.profileImageUrl}
                        name={userProfile?.name || user?.email || 'User'}
                        size={40}
                        textSize={16}
                    />
                    <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                        {loadingProfile ? 'Loading...' : (userProfile?.name || user?.email || 'User')}
                    </Text>
                    <Ionicons name={isWeekNavigatorVisible ? 'chevron-up' : 'chevron-down'} size={20} color="#2F4858" />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => setShowFilters(!showFilters)}>
                        <Ionicons name="filter-outline" size={24} color="#2F4858" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/notifications')}>
                        <Ionicons name="notifications-outline" size={24} color="#2F4858" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(main)/settings')}>
                        <Ionicons name="settings-outline" size={24} color="#2F4858" />
                    </TouchableOpacity>
                </View>
            </View>
            {isWeekNavigatorVisible && <WeekNavigator />}
            
            {showFilters && (
                <View style={styles.filterContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search entries..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                    <View style={styles.filterTags}>
                        <TouchableOpacity 
                            style={[styles.tagButton, filterTags.includes('favorite') && styles.activeTag]}
                            onPress={() => toggleFilterTag('favorite')}
                        >
                            <Ionicons name="heart" size={16} color={filterTags.includes('favorite') ? '#5D9275' : '#666'} />
                            <Text style={[styles.tagText, filterTags.includes('favorite') && styles.activeTagText]}>Favorites</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tagButton, filterTags.includes('milestone') && styles.activeTag]}
                            onPress={() => toggleFilterTag('milestone')}
                        >
                            <Ionicons name="ribbon-outline" size={16} color={filterTags.includes('milestone') ? '#5D9275' : '#666'} />
                            <Text style={[styles.tagText, filterTags.includes('milestone') && styles.activeTagText]}>Milestones</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            
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
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item)}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContentContainer}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4858',
   
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

