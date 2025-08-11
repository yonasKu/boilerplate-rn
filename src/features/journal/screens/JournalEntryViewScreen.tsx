import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJournal, JournalEntry } from '@/hooks/useJournal';

import ShareBottomSheet from '../components/ShareBottomSheet';
import { Colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const heroHeight = width * 1.25;

const JournalEntryViewScreen = () => {
    const router = useRouter();
    const { entryId } = useLocalSearchParams<{ entryId: string }>();
    const { getEntryById, updateEntry } = useJournal();
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (entryId) {
            const fetchEntry = async () => {
                setIsLoading(true);
                try {
                    const fetchedEntry = await getEntryById(entryId);
                    if (fetchedEntry) {
                        setEntry(fetchedEntry);
                    } else {
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
        setEntry(updatedEntry);
        try {
            await updateEntry(entry.id, { isFavorited: updatedEntry.isFavorited });
        } catch (err) {
            setEntry(entry);
            Alert.alert('Error', 'Could not update favorite status.');
        }
    };

    const handleToggleMilestone = async () => {
        if (!entry) return;
        const updatedEntry = { ...entry, isMilestone: !entry.isMilestone };
        setEntry(updatedEntry);
        try {
            await updateEntry(entry.id, { isMilestone: updatedEntry.isMilestone });
        } catch (err) {
            setEntry(entry);
            Alert.alert('Error', 'Could not update milestone status.');
        }
    };

    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    if (!entry) {
        return <View style={styles.centered}><Text>Entry not found.</Text></View>;
    }

    const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date();
    const firstImage = entry.media && entry.media.length > 0 ? entry.media[0] : null;
    const otherMedia = entry.media && entry.media.length > 1 ? entry.media.slice(1) : [];

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {firstImage && (
                    <ImageBackground source={{ uri: firstImage.url }} style={styles.heroImage}>
                        <View style={[styles.headerButtons, { top: insets.top + 10 }]}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                                <Image source={require('../../../assets/images/Chevron_Left_icon.png')} style={styles.iconImage} />
                            </TouchableOpacity>
                            <View style={styles.rightHeaderButtons}>
                                <TouchableOpacity onPress={() => setShowShareSheet(true)} style={styles.iconButton}>
                                    <Image source={require('../../../assets/images/Share_icon.png')} style={styles.iconImage} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => router.push({ pathname: '/(main)/new-entry', params: { entryId: entry.id } })} style={styles.iconButton}>
                                     <Image source={require('../../../assets/images/edit-2_icon.png')} style={styles.iconImage} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ImageBackground>
                )}

                <View style={styles.contentContainer}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setIsTextExpanded(!isTextExpanded)} style={styles.dateAndTextContainer}>
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateDay}>{entryDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}</Text>
                            <Text style={styles.dateNumber}>{entryDate.getDate()}</Text>
                            <Text style={styles.dateMonth}>{entryDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</Text>
                        </View>
                        <View style={styles.textWrapper}>
                            <Text style={styles.entryText} numberOfLines={isTextExpanded ? undefined : 4}>
                                {entry.text}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.bottomContentContainer}>
                        <Text style={styles.locationText}>Redwood city, CA</Text>
                        <View style={styles.actionButtonsGroup}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleToggleFavorite}
                            >
                                <Ionicons name={entry.isFavorited ? 'heart' : 'heart-outline'} size={22} color={entry.isFavorited ? '#FF8080' : Colors.mediumGrey} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={handleToggleMilestone}
                            >
                                <Image source={require('../../../assets/images/Trophy_icon.png')} style={[styles.actionIcon, { tintColor: entry.isMilestone ? Colors.primary : Colors.mediumGrey }]} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {otherMedia.length > 0 && (
                    <View style={styles.mediaGridContainer}>
                        {otherMedia.map((item, index) => (
                            <View key={index} style={styles.gridItem}>
                                <Image source={{ uri: item.url }} style={styles.mediaImage} />
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <ShareBottomSheet
                isVisible={showShareSheet}
                onClose={() => setShowShareSheet(false)}
                onShare={(platform) => {
                    setShowShareSheet(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 2,
        backgroundColor: Colors.white,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
        padding: 2,
    },
    heroImage: {
        width: '100%',
        height: heroHeight,
        justifyContent: 'space-between',
        resizeMode: 'cover',
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        position: 'absolute',
        left: 0,
        right: 0,
    },
    rightHeaderButtons: {
        flexDirection: 'row',
        gap: 4,
    },
    iconButton: {
        padding: 8,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    iconImage: {
        width: 24,
        height: 24,
        tintColor: 'white',
    },
    contentContainer: {
        padding: 20,
        backgroundColor: Colors.white,
        marginTop: -30, // Pulls the content up over the hero image's bottom edge
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    dateAndTextContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    dateContainer: {
        width: 50, // Fixed width for the date container
        alignItems: 'flex-end',
        marginRight: 16,
        paddingTop: 5,
    },
    dateDay: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: Colors.darkGrey,
        lineHeight: 18,
        letterSpacing: 2.2,
    },
    dateNumber: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: Colors.black,
        lineHeight: 34,
    },
    dateMonth: {
        fontSize: 14,
        fontFamily: 'Poppins-Bold',
        color: Colors.darkGrey,
        lineHeight: 18,
        letterSpacing: 0.25,
    },
    textWrapper: {
        flex: 1,
        marginLeft: -66, // -(dateContainer.width + dateContainer.marginRight)
        paddingLeft: 66,
    },
    entryText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: Colors.darkGrey,
        lineHeight: 22.4, // 14 * 1.6
    },
    bottomContentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    locationText: {
        fontSize: 14,
        fontFamily: 'Poppins',
        color: Colors.mediumGrey,
    },
    actionButtonsGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: 16,
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
    },
    actionIcon: {
        width: 22,
        height: 22,
    },
    mediaGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
    },
    gridItem: {
        width: (width - 40) / 3, // 3 columns with padding
        height: (width - 40) / 3,
        padding: 5,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
});

export default JournalEntryViewScreen;
