import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewing from 'react-native-image-viewing';

const { width } = Dimensions.get('window');
const heroHeight = width * 1.1;

const sampleRecap = {
    id: '1',
    title: '✨ Week of July 15, 2025',
    description: 'Zoe has been practicing saying “hi” and “bye” and waving all day today! She also has been practicing throwing– it’s so funny! Tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur',
    media: [
        { url: 'https://i.imgur.com/S8W7O4g.jpeg' },
        { url: 'https://i.imgur.com/AD3G415.jpeg' },
        { url: 'https://i.imgur.com/2MD3O5y.jpeg' },
        { url: 'https://i.imgur.com/TzP1E9A.jpeg' },
        { url: 'https://i.imgur.com/WbA4W5t.jpeg' },
        { url: 'https://i.imgur.com/S8W7O4g.jpeg' },
    ],
};

const RecapViewScreen = () => {
    const router = useRouter();
    const { recapId } = useLocalSearchParams<{ recapId: string }>();
    const insets = useSafeAreaInsets();
    const [showFullScreenGallery, setShowFullScreenGallery] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const recap = sampleRecap; // Using sample data
    const imagesForViewer = recap.media.map(item => ({ uri: item.url }));

    const handleImagePress = (index: number) => {
        setCurrentImageIndex(index);
        setShowFullScreenGallery(true);
    };

    const renderImageCarousel = () => {
        if (recap.media.length === 0) return null;

        return (
            <View style={styles.imageCarouselContainer}>
                <Carousel
                    loop
                    width={width}
                    height={heroHeight}
                    autoPlay={true}
                    autoPlayInterval={3000}
                    data={recap.media}
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
                <View style={[styles.headerButtons, { top: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                         <Ionicons name="chevron-back" size={24} color={Colors.white} />
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
                    <Text style={styles.title}>{recap.title}</Text>
                    <Text style={styles.description}>{recap.description}</Text>

                    <View style={styles.mediaGridContainer}>
                        {recap.media.map((item, index) => (
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
                </View>
            </ScrollView>

            <View style={styles.footer}>
                 <TouchableOpacity style={styles.footerButton}>
                    <Ionicons name="arrow-redo-outline" size={24} color={Colors.darkGrey} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.commentsButton}>
                    <Text style={styles.commentsText}>12 Comments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerButton}>
                    <Ionicons name="heart-outline" size={24} color={Colors.darkGrey} />
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    scrollView: { flex: 1 },
    imageCarouselContainer: { width: '100%', height: heroHeight, position: 'relative' },
    carouselImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    headerButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, position: 'absolute', left: 0, right: 0 },
    iconButton: { padding: 8, borderRadius: 25, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
    contentContainer: { padding: 20, backgroundColor: Colors.white, marginTop: -30, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    title: { fontSize: 20, fontWeight: 'bold', color: Colors.black, marginBottom: 10 },
    description: { fontSize: 14, lineHeight: 22, color: Colors.darkGrey, marginBottom: 20 },
    mediaGridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -2 },
    gridItem: { width: '33.333%', aspectRatio: 1, padding: 2 },
    mediaImage: { width: '100%', height: '100%', borderRadius: 8 },
    footer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.lightGrey, backgroundColor: Colors.white, paddingBottom: 20 },
    footerButton: { padding: 10 },
    commentsButton: { paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: Colors.lightGrey, borderRadius: 20 },
    commentsText: { fontSize: 14, fontWeight: '600', color: Colors.darkGrey },
});

export default RecapViewScreen;

