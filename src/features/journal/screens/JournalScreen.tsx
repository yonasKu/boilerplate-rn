import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WeekNavigator from '../components/WeekNavigator';
import JournalEntryCard from '../components/JournalEntryCard';
import JournalFilter from '../components/JournalFilter';
import ActionCallout from '../../../components/ui/ActionCallout';
import DateTimePicker from '@react-native-community/datetimepicker';
import ShareBottomSheet from '../components/ShareBottomSheet';
import { Colors } from '@/theme';
import { ProfileAvatar } from '../../../components/ProfileAvatar';
import { useJournalScreen } from '@/hooks/useJournalScreen';

const JournalScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const {
        // data
        entries,
        isLoading,
        error,
        filteredEntries,

        // profile / notifications
        userProfile,
        loadingProfile,
        unreadNotifications,

        // filters / search / date
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

        // refresh
        refreshing,
        onRefresh,
        refreshEntries,

        // share
        showShareModal,
        setShowShareModal,
        shareEntry,
        handleShare,
        handleShareAction,

        // entry handlers
        handleLike,
        handleToggleMilestone,
        handleEdit,
        handleDelete,

        // derived UI
        displayName,
        avatarUrl,
        journalTitle,
    } = useJournalScreen();

    // All state/effects/handlers are provided by useJournalScreen

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
            {entries.length > 0 && (
                <WeekNavigator
                    selectedDate={selectedDate}
                    onDayPress={async (date) => {
                        // Toggle if same day tapped, else set new date
                        if (selectedDate &&
                            date.getFullYear() === selectedDate.getFullYear() &&
                            date.getMonth() === selectedDate.getMonth() &&
                            date.getDate() === selectedDate.getDate()) {
                            setSelectedDate(null);
                        } else {
                            setSelectedDate(date);
                        }
                        // Refresh entries after selection change
                        try { await refreshEntries(); } catch {}
                    }}
                />
            )}
            {entries.length > 0 && (
                <JournalFilter
                    onDatePress={() => setShowDatePicker(true)}
                    onFilterChange={async (filter) => {
                        if (filter === 'All') {
                            setFilterTags([]);
                            setSelectedDate(null);
                            try { await refreshEntries(); } catch {}
                        } else if (filter === 'Favorites') {
                            setFilterTags(['favorite']);
                            setSelectedDate(null);
                        } else if (filter === 'Milestones') {
                            setFilterTags(['milestone']);
                            setSelectedDate(null);
                        }
                    }}
                    activeFilter={selectedDate ? 'Date' : (
                        filterTags.length === 0 ? 'All' :
                            (filterTags.includes('favorite') ? 'Favorites' :
                                (filterTags.includes('milestone') ? 'Milestones' : 'All'))
                    )}
                />
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                    onChange={(_e, date) => {
                        if (date) {
                            setSelectedDate(date);
                        }
                        if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                        }
                    }}
                />
            )}

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
        flex: 1,
        minWidth: 0,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Poppins_500Medium',
        color: Colors.black,
        flexShrink: 1,
        marginHorizontal: 6,
        minWidth: 0,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
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
