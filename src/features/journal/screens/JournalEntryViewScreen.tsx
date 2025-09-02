import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image, ImageBackground, Dimensions, Modal, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useJournal, JournalEntry } from '@/hooks/useJournal';

import ShareBottomSheet from '../components/ShareBottomSheet';
import { Colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getChild } from '@/services/childService';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewing from 'react-native-image-viewing';

const { width, height } = Dimensions.get('window');
const heroHeight = width * 1.5; // Reduced height as per user request
const DATE_GUTTER = 84; // widened gutter to prevent any overlap (date width 60 + gap 16 + extra 8)
const ENTRY_LINE_HEIGHT = 26; // keep in sync with styles.entryText.lineHeight
const LINES_BESIDE_DATE = 4; // force-wrap after 4 lines next to the date

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
    const [childAgeLabels, setChildAgeLabels] = useState<string[]>([]);
    const [contentWidth, setContentWidth] = useState(0);
    const [dateHeight, setDateHeight] = useState(0);
    const [splitText, setSplitText] = useState<{ prefix: string; suffix: string; linesUsed: number; prefixBottom: number } | null>(null);


    useEffect(() => {
        const loadChildLabels = async () => {
            if (!entry || !Array.isArray(entry.childIds) || entry.childIds.length === 0) {
                setChildAgeLabels([]);
                return;
            }
            try {
                const results = await Promise.all(
                    entry.childIds.map(async (id) => {
                        try {
                            const c = await getChild(id);
                            const age = entry.childAgeAtEntry?.[id] ?? '';
                            if (c?.name && age) return `${c.name} — ${age}`;
                            if (age) return age;
                            return null;
                        } catch {
                            return null;
                        }
                    })
                );
                setChildAgeLabels(results.filter((x): x is string => Boolean(x)));
            } catch (e) {
                setChildAgeLabels([]);
            }
        };
        loadChildLabels();
    }, [entry?.id, JSON.stringify(entry?.childIds)]);

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

    

                <View style={[styles.headerButtons, { top: 16 }]}>
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
        <SafeAreaView style={styles.container}>
            <ScrollView style={[styles.scrollView]}>
                {renderImageCarousel()}

                <View style={styles.contentContainer}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            const next = !isTextExpanded;
                            setIsTextExpanded(next);
                            if (!next) setSplitText(null); // reset when collapsing
                        }}
                        style={styles.dateAndTextContainer}
                        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
                    >
                        {isTextExpanded ? (
                            <View style={styles.flowContainer}>
                                {/* Date overlay */}
                                <View
                                    style={[styles.dateContainer, styles.dateOverlay]}
                                    onLayout={(e) => setDateHeight(e.nativeEvent.layout.height)}
                                >
                                    <Text style={styles.dateDay}>{entryDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}</Text>
                                    <Text style={styles.dateNumber}>{entryDate.getDate()}</Text>
                                    <Text style={styles.dateMonth}>{entryDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</Text>
                                </View>
                                {/* Hidden measurer: find split point after exactly 4 lines */}
                                {contentWidth > 0 && !splitText && (
                                    <Text
                                        style={[
                                            styles.entryText,
                                            {
                                                position: 'absolute',
                                                opacity: 0,
                                                width: Math.max(20, contentWidth - DATE_GUTTER - 2), // slight extra shrink to mirror visible padding quirks
                                            },
                                        ]}
                                        onTextLayout={(e) => {
                                            const lines = e.nativeEvent.lines || [] as any[];
                                            // Always split after 4 lines (or fewer if text is short)
                                            const fit = Math.max(1, Math.min(LINES_BESIDE_DATE, lines.length));

                                            // Prefer platform-provided end index
                                            const lastIdx = Math.min(fit - 1, Math.max(0, lines.length - 1));
                                            const endFromPlatform = (lines as any)[lastIdx]?.end as number | undefined;
                                            let prefixLen = endFromPlatform ?? 0;
                                            if (!prefixLen) {
                                                let prefixText = '';
                                                for (let i = 0; i < Math.min(fit, lines.length); i++) prefixText += lines[i].text;
                                                prefixLen = prefixText.length;
                                            }
                                            const prefixBottom = (() => {
                                                const L = lines[lastIdx] as any;
                                                return (L?.y ?? 0) + (L?.height ?? ENTRY_LINE_HEIGHT);
                                            })();
                                            setSplitText({
                                                prefix: entry.text.slice(0, prefixLen),
                                                suffix: entry.text.slice(prefixLen),
                                                linesUsed: fit,
                                                prefixBottom,
                                            });
                                        }}
                                    >
                                        {entry.text}
                                    </Text>
                                )}
                                {/* Visible split */}
                                {splitText ? (
                                    <>
                                        <Text style={[styles.entryText, { paddingLeft: DATE_GUTTER }]} numberOfLines={LINES_BESIDE_DATE}>
                                            {splitText.prefix}
                                        </Text>
                                        {/* Spacer to ensure suffix starts strictly below the date block if date is taller than 4 lines */}
                                        {dateHeight > 0 ? (
                                            <View style={{ height: Math.max(0, dateHeight - splitText.prefixBottom + 6) }} />
                                        ) : null}
                                        {splitText.suffix ? (
                                            <Text style={styles.entryText}>{splitText.suffix}</Text>
                                        ) : null}
                                    </>
                                ) : (
                                    // Fallback while measuring: show single block with padding so UI isn't blank
                                    <Text style={[styles.entryText, { paddingLeft: DATE_GUTTER + 2 }]}>{entry.text}</Text>
                                )}
                            </View>
                        ) : (
                            // Collapsed: render with the same overlay technique and show 4 lines next to the date
                            <View style={[styles.flowContainer, { minHeight: Math.max(88, dateHeight) }]}>
                                <View
                                    style={[styles.dateContainer, styles.dateOverlay]}
                                    onLayout={(e) => setDateHeight(e.nativeEvent.layout.height)}
                                >
                                    <Text style={styles.dateDay}>{entryDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}</Text>
                                    <Text style={styles.dateNumber}>{entryDate.getDate()}</Text>
                                    <Text style={styles.dateMonth}>{entryDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</Text>
                                </View>
                                <Text style={[styles.entryText, { paddingLeft: DATE_GUTTER }]} numberOfLines={4}>
                                    {entry.text}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.bottomContentContainer}>
                        {childAgeLabels.length > 0 ? (
                            <View>
                                {childAgeLabels.map((label, idx) => (
                                    <Text key={idx} style={styles.ageText}>{label}</Text>
                                ))}
                            </View>
                        ) : (
                            <View />
                        )}
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
        </SafeAreaView>
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
        marginLeft: -2,
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
        width: 60, // Slightly wider for larger date number
        alignItems: 'flex-end',
        marginRight: 16,
        paddingTop: 5,
    },
    dateDay: {
        fontSize: 18,
        fontFamily: 'Poppins',
        color: Colors.darkGrey,
        lineHeight: 18,
        letterSpacing: 3.5,
    },
    dateNumber: {
        fontSize: 32, // Larger per wires
        fontFamily: 'Poppins', // Remove bold
        color: Colors.black,
        lineHeight: 36,
    },
    dateMonth: {
        fontSize: 18,
        fontFamily: 'Poppins', // Regular
        color: Colors.darkGrey,
        lineHeight: 18,
        letterSpacing: 0.5,
    },
    dateOverlay: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 60,
        marginRight: 16,
        paddingTop: 5,
        paddingBottom: 6,
        // backgroundColor: 'transparent'
        zIndex: 2,
        elevation: 2,
        pointerEvents: 'none',
    },
    textWrapper: {
        flex: 1,
        marginLeft: -76, // shift text left into the date gutter for collapsed preview
        paddingLeft: 76,
        marginBottom: 20,
    },
    flowContainer: {
        position: 'relative',
        marginBottom: 20,
        width: '100%',
    },
    entryText: {
        fontSize: 16,
        fontFamily: 'Poppins',
        color: Colors.darkGrey,
        lineHeight: 26,
        textAlign: 'justify',
        letterSpacing: 0.2,
    },
    ageText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: Colors.mediumGrey,
    },
    bottomContentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
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
