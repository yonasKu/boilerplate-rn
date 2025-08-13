import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { useRouter } from 'expo-router';

const sampleData = {
    id: '1',
    mainImage: 'https://i.imgur.com/S8W7O4g.jpeg',
    gridImages: [
        'https://i.imgur.com/AD3G415.jpeg',
        'https://i.imgur.com/2MD3O5y.jpeg',
        'https://i.imgur.com/TzP1E9A.jpeg',
        'https://i.imgur.com/WbA4W5t.jpeg',
    ],
    date: 'May 12, 2025',
    title: 'First Steps',
    age: '11 months, 3 days',
};

export const RecapCard = () => {
    const router = useRouter();

    const handlePress = () => {
        router.push({ pathname: '/recaps/recap-view', params: { recapId: sampleData.id } });
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <View style={styles.card}>
                <ImageBackground source={{ uri: sampleData.mainImage }} style={styles.mainImage} imageStyle={{ borderRadius: 16 }}>
                    <View style={styles.dateOverlay}>
                        <Text style={styles.dateText}>{sampleData.date}</Text>
                    </View>
                </ImageBackground>
                <View style={styles.contentContainer}>
                    <View style={styles.imageGrid}>
                        {sampleData.gridImages.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.gridImage} />
                        ))}
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{sampleData.title}</Text>
                        <Text style={styles.ageText}>{sampleData.age}</Text>
                    </View>
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.footerButton}>
                            <Ionicons name="arrow-redo-outline" size={24} color={Colors.darkGrey} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.footerButton}>
                            <Ionicons name="heart-outline" size={24} color={Colors.darkGrey} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mainImage: {
        height: 200,
        justifyContent: 'flex-end',
    },
    dateOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        position: 'absolute',
        top: 10,
        left: 10,
        borderRadius: 8,
    },
    dateText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    contentContainer: {
        padding: 12,
    },
    imageGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gridImage: {
        width: '24%',
        height: 80,
        borderRadius: 8,
    },
    textContainer: {
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.black,
    },
    ageText: {
        fontSize: 14,
        color: Colors.black,
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    footerButton: {},
});
