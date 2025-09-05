import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewing from 'react-native-image-viewing';
import FullScreenImageFooter from '../components/FullScreenImageFooter';
import FamilySharingBubbles from '../components/FamilySharingBubbles';
import CommentsSection from '../components/comments/CommentsSection';
import ShareBottomSheet from '../../journal/components/ShareBottomSheet';
import { useRecap } from '../hooks/useRecap';
import { recapInteractionService } from '../services/recapInteractionService';
import { recapCommentsService } from '../services/recapCommentsService';
import { auth } from '@/lib/firebase/firebaseConfig';
import { Recap } from '../../../services/aiRecapService';


const RecapViewScreen = () => {
    const router = useRouter();
    const { recapId, openComments } = useLocalSearchParams<{ recapId: string, openComments?: string }>();
    const insets = useSafeAreaInsets();
    const [showFullScreenGallery, setShowFullScreenGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isCommentsVisible, setCommentsVisible] = useState(false);
    const [isShareSheetVisible, setShareSheetVisible] = useState(false);
    const [commentImageContext, setCommentImageContext] = useState<{
        imageUrl?: string;
        imageThumbUrl?: string;
        imageIndex?: number;
        imageStoragePath?: string;
    } | undefined>(undefined);

    const { recap, loading, error } = useRecap(recapId);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);

    const formatRecapTitle = (recap: Recap) => {
        if (!recap?.type || !recap.period?.endDate) {
            return 'Recap';
        }

        // Ensure endDate is a Date object
        const endDate = recap.period.endDate instanceof Date 
            ? recap.period.endDate 
            : new Date(recap.period.endDate);

        // Check if endDate is valid
        if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
            return 'Recap';
        }

        const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        switch (recap.type) {
            case 'weekly':
                return `Week of ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
            case 'monthly':
                return `${capitalize(recap.type)} of ${endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            case 'yearly':
                return `${capitalize(recap.type)} of ${endDate.toLocaleDateString('en-US', { year: 'numeric' })}`;
            default:
                return 'Recap';
        }
    };

    useEffect(() => {
        // console.log('RecapViewScreen - recap:', recap);
        // console.log('RecapViewScreen - recap.id:', recap?.id);
        // console.log('RecapViewScreen - auth.currentUser:', auth.currentUser);
        
        if (!recap) return;
        
        // Auto-open comments if requested
        if (openComments === 'true') {
            setCommentsVisible(true);
        }

        // Fetch initial comment count
        const fetchCommentCount = async () => {
            try {
                const comments = await recapCommentsService.getComments(recapId);
                setCommentCount(comments.length);
            } catch (error) {
                console.error('Failed to fetch comment count:', error);
            }
        };
        
        fetchCommentCount();
    }, [recap, recapId, openComments]);

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

    const handleCommentCountUpdate = (count: number) => {
        setCommentCount(count);
    };

    const handleLikePress = async () => {
        if (!recap || !auth.currentUser?.uid) {
            console.log('Like press blocked - missing recap or user:', { recap: !!recap, user: !!auth.currentUser?.uid });
            return;
        }
        
        console.log('Toggling like for recap:', recap.id, 'user:', auth.currentUser.uid);
        try {
            const newLikeStatus = await recapInteractionService.toggleLike(recap.id!, auth.currentUser.uid);
            console.log('Like toggled successfully:', newLikeStatus);
            setIsLiked(newLikeStatus);
            setLikesCount(prev => newLikeStatus ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Error toggling like:', error);
            console.error('Error details:', { recapId: recap.id, userId: auth.currentUser.uid });
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
            return (
                <View style={styles.placeholderContainer}>
                    <View style={[styles.headerButtons, { top: 20 }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                            <Ionicons name="chevron-back" size={24} color={Colors.white} />
                        </TouchableOpacity>
                        <View style={styles.headerMiddle} pointerEvents="box-none">
                            <FamilySharingBubbles />
                        </View>
                        <TouchableOpacity onPress={handleSharePress} style={styles.iconButton}>
                            <Ionicons name="arrow-redo-outline" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.placeholderContent}>
                        <Image 
                            source={require('@/assets/images/splash_logo.png')} 
                            style={styles.placeholderIcon}
                            resizeMode="contain"
                        />
                        <Text style={styles.placeholderText}>No images available</Text>
                    </View>
                </View>
            );
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
                <View style={[styles.headerButtons, { top: 20 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="chevron-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={styles.headerMiddle} pointerEvents="box-none">
                        <FamilySharingBubbles />
                    </View>
                    <TouchableOpacity onPress={handleSharePress} style={styles.iconButton}>
                        <Ionicons name="arrow-redo-outline" size={24} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {renderImageCarousel()}

                <View style={styles.contentContainer}>
                    <View style={styles.titleContainer}>
                        <Image source={require('@/assets/images/two_stars_icon.png')} style={styles.sparkleIcon} />
                        <Text style={styles.title}>{recap.title || formatRecapTitle(recap)}</Text>
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
                <TouchableOpacity
                    style={styles.commentsButton}
                    onPress={() => {
                        // Open general comments: clear any image-specific context
                        setCommentImageContext(undefined);
                        setCommentsVisible(true);
                    }}
                >
                    <Text style={styles.commentsText}>{commentCount} Comments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerButton} onPress={handleLikePress}>
                    <Ionicons 
                        name={(recap as any).isFavorited ? "heart" : "heart-outline"} 
                        size={24} 
                        color={(recap as any).isFavorited ? Colors.red : Colors.grey} 
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
                FooterComponent={() => (
                    <FullScreenImageFooter
                        commentCount={commentCount}
                        isLiked={(recap as any).isFavorited}
                        onSharePress={handleSharePress}
                        onCommentPress={() => {
                            // Set image context from the current image in the viewer
                            const idx = currentImageIndex;
                            const url = media?.[idx];
                            setCommentImageContext({ imageIndex: idx, imageUrl: url });
                            setShowFullScreenGallery(false);
                            setCommentsVisible(true);
                        }}
                        onLikePress={handleLikePress}
                    />
                )}
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
                            <View style={[styles.commentsModal, { paddingBottom: insets.bottom + 10}]}>
                                <CommentsSection
                                    recapId={recapId}
                                    onClose={() => setCommentsVisible(false)}
                                    onCommentCountUpdate={handleCommentCountUpdate}
                                    imageContext={commentImageContext}
                                />
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
        </SafeAreaView>
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
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerMiddle: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: 16,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 22,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth:2,
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
        height: '55%',
        backgroundColor: Colors.white,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    placeholderContainer: {
        position: 'relative',
        marginBottom: 8,
        height: heroHeight,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderContent: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    placeholderIcon: {
        width: 200,
        height: 200,
        marginBottom: 16,
        opacity: 0.8,
    },
    placeholderText: {
        fontSize: 16,
        color: Colors.white,
        opacity: 0.8,
    },
    placeholderImage: {
        width: 120,
        height: 120,
        opacity: 0.7,
    },
});

export default RecapViewScreen;
