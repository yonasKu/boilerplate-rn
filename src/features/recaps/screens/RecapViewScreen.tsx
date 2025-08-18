import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewing from 'react-native-image-viewing';
import CommentsSection from '../components/comments/CommentsSection';
import ShareBottomSheet from '../../journal/components/ShareBottomSheet';
import { useRecap } from '../hooks/useRecap';
import { recapInteractionService } from '../services/recapInteractionService';
import { auth } from '@/lib/firebase/firebaseConfig';


const RecapViewScreen = () => {
    const router = useRouter();
    const { recapId, openComments } = useLocalSearchParams<{ recapId: string, openComments?: string }>();
    const insets = useSafeAreaInsets();
    const [showFullScreenGallery, setShowFullScreenGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isCommentsVisible, setCommentsVisible] = useState(false);
    const [isShareSheetVisible, setShareSheetVisible] = useState(false);

    const { recap, loading, error } = useRecap(recapId);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    const formatRecapTitle = (recap: any) => {
        if (!recap?.type || !recap.period?.startDate) {
            return 'Recap';
        }

        const startDate = new Date(recap.period.startDate.seconds * 1000);

        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        switch (recap.type) {
            case 'daily':
                return `Week of ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
            case 'weekly':
                return `Week of ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
            case 'monthly':
                return `${capitalize(recap.type)} of ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            case 'yearly':
                return `${capitalize(recap.type)} of ${startDate.toLocaleDateString('en-US', { year: 'numeric' })}`;
            default:
                return 'Recap';
        }
    };

    useEffect(() => {
        if (!recap || !auth.currentUser?.uid) return;
        
        const loadInteractionData = async () => {
            try {
                const [liked, count] = await Promise.all([
                    recapInteractionService.isLikedByUser(recap.id!, auth.currentUser!.uid),
                    recapInteractionService.getLikesCount(recap.id!)
                ]);
                setIsLiked(liked);
                setLikesCount(count);
            } catch (error) {
                console.error('Error loading interaction data:', error);
            }
        };
        
        loadInteractionData();
        
        // Auto-open comments if requested
        if (openComments === 'true') {
            setCommentsVisible(true);
        }
    }, [recap, openComments]);

    const imagesForViewer = recap?.media?.highlightPhotos?.map((url: string) => ({ uri: url })) ?? [];
    const media = recap?.media?.highlightPhotos ?? [];
    
    const handleImagePress = (index: number) => {
        setCurrentImageIndex(index);
        setShowFullScreenGallery(true);
    };

    const handleSharePress = () => {
        setShareSheetVisible(true);
    };

    const handleShareOption = (platform: 'copy' | 'system') => {
        setShareSheetVisible(false);
        Alert.alert('Sharing', `Shared via ${platform}`);
    };

    const handleLikePress = async () => {
        if (!recap || !auth.currentUser?.uid) return;
        
        try {
            const newLikeStatus = await recapInteractionService.toggleLike(recap.id!, auth.currentUser.uid);
            setIsLiked(newLikeStatus);
            setLikesCount(prev => newLikeStatus ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };
    
    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Loading recap...</Text>
            </View>
        );
    }

    if (error || !recap) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Recap not found</Text>
            </View>
        );
    }

    const renderImageCarousel = () => {
        if (media.length === 0) {
            return <View style={{ height: heroHeight /2 }} />;
        }

        return (
            <View style={styles.imageCarouselContainer}>
                <Carousel
                    loop
                    width={width}
                    height={heroHeight}
                    autoPlay={true}
                    autoPlayInterval={3000}
                    data={media}
                    onSnapToItem={(index: number) => setCurrentImageIndex(index)}
                    renderItem={({ item, index }: { item: string; index: number }) => (
                        <TouchableOpacity
                            key={index}
                            style={{ flex: 1 }}
                            onPress={() => handleImagePress(index)}
                            activeOpacity={1}
                        >
                            <ImageBackground
                                source={{ uri: item }}
                                style={styles.carouselImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}
                />
                <View style={[styles.headerButtons, { top: insets.top + 20 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="chevron-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSharePress} style={styles.iconButton}>
                        <Ionicons name="share-outline" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {renderImageCarousel()}

                <View style={styles.contentContainer}>
                    <View style={styles.titleContainer}>
                        <Image source={require('@/assets/images/two_stars_icon.png')} style={styles.sparkleIcon} />
                        <Text style={styles.title}>{formatRecapTitle(recap)}</Text>
                    </View>
                    <Text style={styles.description}>{recap.aiGenerated?.recapText || ''}</Text>

                    <View style={styles.mediaGridContainer}>
                        {media.map((url: string, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.gridItem}
                                onPress={() => handleImagePress(index)}
                                activeOpacity={0.8}
                            >
                                <Image source={{ uri: url }} style={styles.mediaImage} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.footerButton} onPress={handleSharePress}>
                    <Ionicons name="arrow-redo-outline" size={24} color={Colors.grey} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentsButton} onPress={() => setCommentsVisible(true)}>
                    <Text style={styles.commentsText}>{(recap as any).commentCount || 0} Comments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerButton} onPress={handleLikePress}>
                    <Ionicons 
                        name={isLiked ? "heart" : "heart-outline"} 
                        size={24} 
                        color={isLiked ? Colors.red : Colors.grey} 
                    />
                </TouchableOpacity>
            </View>

            <ImageViewing
                images={imagesForViewer}
                imageIndex={currentImageIndex}
                visible={showFullScreenGallery}
                onRequestClose={() => setShowFullScreenGallery(false)}
                presentationStyle="fullScreen"
                backgroundColor="black"
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={isCommentsVisible}
                onRequestClose={() => setCommentsVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setCommentsVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.commentsModal}>
                                <CommentsSection entryId={recapId} onClose={() => setCommentsVisible(false)} />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <ShareBottomSheet 
                isVisible={isShareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                onShare={handleShareOption}
            />
        </View>
    );
};

const { width } = Dimensions.get('window');
const heroHeight = width * 1.1;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollView: {
        flex: 1,
    },
    imageCarouselContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    carouselImage: {
        width: width,
        height: heroHeight,
    },
    headerButtons: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        padding: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sparkleIcon: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.black,
    },
    description: {
        fontSize: 16,
        color: Colors.grey,
        lineHeight: 24,
        marginBottom: 20,
    },
    mediaGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
        marginBottom: 20,
    },
    gridItem: {
        width: '33.33%',
        aspectRatio: 1,
        padding: 4,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGrey,
        backgroundColor: Colors.white,
    },
    footerButton: {
        padding: 10,
    },
    commentsButton: {
        padding: 10,
    },
    commentsText: {
        fontSize: 14,
        color: Colors.grey,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    commentsModal: {
        width: '100%',
        height: '80%',
        backgroundColor: Colors.white,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
});

export default RecapViewScreen;
