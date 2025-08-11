import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJournal, JournalEntry } from '@/hooks/useJournal';
import JournalPreviewActionButtons from '../components/JournalPreviewActionButtons';
import ShareBottomSheet from '../components/ShareBottomSheet';
import JournalEntryPreviewCard from '@/features/journal/components/JournalEntryPreviewCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const JournalEntryViewScreen = () => {
    const router = useRouter();
    const { entryId } = useLocalSearchParams<{ entryId: string }>();
    console.log('[JournalEntryViewScreen] Mounted with entryId:', entryId);
    const { getEntryById, updateEntry } = useJournal();
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (entryId) {
            const fetchEntry = async () => {
                console.log('[JournalEntryViewScreen] Starting fetch for entryId:', entryId);
                setIsLoading(true);
                try {
                    const fetchedEntry = await getEntryById(entryId);
                    console.log('[JournalEntryViewScreen] Fetched entry data:', fetchedEntry);
                    if (fetchedEntry) {
                        setEntry(fetchedEntry);
                    } else {
                        console.error('[JournalEntryViewScreen] Entry not found in database for ID:', entryId);
                        Alert.alert('Error', 'Journal entry not found.');
                        router.back();
                    }
                } catch (err) {
                    console.error('[JournalEntryViewScreen] Error fetching entry:', err);
                    Alert.alert('Error', 'Failed to load journal entry.');
                    router.back();
                }
                setIsLoading(false);
            };

            fetchEntry();
        }
    }, [entryId]);

    const handleToggleFavorite = async () => {
        if (!entry) return;
        const updatedEntry = { ...entry, isFavorited: !entry.isFavorited };
        setEntry(updatedEntry); // Optimistic update
        try {
            await updateEntry(entry.id, { isFavorited: updatedEntry.isFavorited });
        } catch (err) {
            console.error('Failed to update favorite status', err);
            setEntry(entry); // Revert on error
            Alert.alert('Error', 'Could not update favorite status.');
        }
    };

    const handleToggleMilestone = async () => {
        if (!entry) return;
        const updatedEntry = { ...entry, isMilestone: !entry.isMilestone };
        setEntry(updatedEntry); // Optimistic update
        try {
            await updateEntry(entry.id, { isMilestone: updatedEntry.isMilestone });
        } catch (err) {
            console.error('Failed to update milestone status', err);
            setEntry(entry); // Revert on error
            Alert.alert('Error', 'Could not update milestone status.');
        }
    };


    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!entry) {
        return (
            <View style={styles.centered}>
                <Text>Entry not found.</Text>
            </View>
        );
    }

    // Safely access the date property
    const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date();

    console.log('[JournalEntryViewScreen] Rendering component with entry:', entry);
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScreenHeader
                title={entryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                onBack={() => router.back()}
                showCalendarIcon={true}
                rightComponent={
                    <TouchableOpacity onPress={() => router.push({ pathname: '/(main)/new-entry', params: { entryId: entry.id } })} style={styles.editButton}>
                        <Image source={require('../../../assets/images/edit-2_icon.png')} style={styles.editIcon} />
                    </TouchableOpacity>
                }
            />
            <ScrollView style={styles.scrollView}>
                {entry && (
                    <>
                        <JournalEntryPreviewCard entry={entry} />
                        <JournalPreviewActionButtons
                            isFavorited={entry.isFavorited}
                            isMilestone={entry.isMilestone}
                            onToggleFavorite={handleToggleFavorite}
                            onToggleMilestone={handleToggleMilestone}
                            onShare={() => setShowShareSheet(true)}
                        />
                    </>
                )}
            </ScrollView>

            <ShareBottomSheet
                isVisible={showShareSheet}
                onClose={() => setShowShareSheet(false)}
                onShare={(platform) => {
                    if (platform === 'copy') {
                        Alert.alert('Success', 'Link copied to clipboard');
                    } else {
                        Alert.alert('Share', 'Opening system share dialog...');
                    }
                    setShowShareSheet(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },


    editButton: {
        padding: 8,
        backgroundColor: Colors.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: {
        width: 20,
        height: 20,
        tintColor: Colors.darkGrey,
    }
});

export default JournalEntryViewScreen;
