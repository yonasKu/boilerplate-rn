import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, ImageBackground, Dimensions, Modal, FlatList, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJournal, JournalEntry } from '@/hooks/useJournal';

import ShareBottomSheet from '../components/ShareBottomSheet';
import { Colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewing from 'react-native-image-viewing';

const { width, height } = Dimensions.get('window');
const heroHeight = width * 1.5; // Reduced height as per user request

const JournalEntryViewScreen = () => {
    const router = useRouter();
    const { entryId } = useLocalSearchParams<{ entryId: string }>();
    const { getEntryById, updateEntry } = useJournal();
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showShareSheet, setShowShareSheet] = useState(false);
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [showFullScreenGallery, setShowFullScreenGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
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
    const allMedia = entry.media || [];
    const imagesForViewer = allMedia.map(item => ({ uri: item.url }));

    const handleImagePress = (index: number) => {
        setCurrentImageIndex(index);
        setShowFullScreenGallery(true);
    };

    const renderImageCarousel = () => {
        if (allMedia.length === 0) return null;

        return (
            <View style={styles.imageCarouselContainer}>
                <Carousel
                    loop
                    width={width}
                    height={heroHeight}
                    autoPlay={true}
                    autoPlayInterval={3000}
                    data={allMedia}
                    onSnapToItem={(index) => setCurrentImageIndex(index)}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            key={index}
                            style={{ flex: 1 }}
                            onPress={() => handleImagePress(index)}
                            activeOpacity={1}
                        >
                            <ImageBackground
                                source={{ uri: item.url }}
                                style={styles.carouselImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}
                />

    

                <View style={[styles.headerButtons, { top: insets.top + 16 }]}>
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
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView style={[styles.scrollView]}>
                {renderImageCarousel()}

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
                        <Text style={styles.locationText}>{entry.location}</Text>
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
                                <Ionicons name={entry.isMilestone ? 'trophy' : 'trophy-outline'} size={22} color={entry.isMilestone ? Colors.golden : Colors.mediumGrey} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {allMedia.length > 0 && (
                        <View style={styles.mediaGridContainer}>
                            {allMedia.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.gridItem}
                                    onPress={() => handleImagePress(index)}
                                    activeOpacity={0.8}
                                >
                                    <Image source={{ uri: item.url }} style={styles.mediaImage} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <ShareBottomSheet
                isVisible={showShareSheet}
                onClose={() => setShowShareSheet(false)}
                onShare={(platform) => {
                    setShowShareSheet(false);
                }}
            />

            {/* Full Screen Image Gallery Modal */}
            <ImageViewing
                images={imagesForViewer}
                imageIndex={currentImageIndex}
                visible={showFullScreenGallery}
                onRequestClose={() => setShowFullScreenGallery(false)}
                presentationStyle="fullScreen"
                animationType="fade"
                doubleTapToZoomEnabled={true}
                HeaderComponent={() => (
                    <TouchableOpacity
                        style={[styles.fullScreenCloseButton, { top: insets.top + 10 }]}
                        onPress={() => setShowFullScreenGallery(false)}
                    >
                        <Image
                            source={require('../../../assets/images/Chevron_Left_icon.png')}
                            style={styles.closeIcon}
                        />
                    </TouchableOpacity>
                )}
                FooterComponent={() => (
                    <View style={{ height: insets.bottom }} />
                )}
                backgroundColor="black"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
        padding: 0, // Reduced margins
    },
    imageCarouselContainer: {
        width: '100%',
        height: 350, // Reduced height
        position: 'relative',
        marginBottom: 8, // Added margin bottom
    },
    carouselImage: {
        width: '100%',
        height: 350, // Reduced height
        resizeMode: 'cover',
        borderRadius: 0, // Squared corners
    },
    headerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12, // Reduced padding
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
        padding: 12, // Reduced padding
        backgroundColor: Colors.white,
        marginTop: -30, // Pulls the content up over the hero image's bottom edge
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
        fontFamily: 'Poppins-Regular', // Un-bolded month
        color: Colors.mediumGrey,
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
        marginHorizontal: -2, // Counteract parent padding
    },
    gridItem: {
        width: '33.333%', // 3 columns
        aspectRatio: 1, // Square items
        padding: 2,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },
    fullScreenCloseButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
    },
    closeIcon: {
        width: 24,
        height: 24,
        tintColor: Colors.white,
    },
});

export default JournalEntryViewScreen;
