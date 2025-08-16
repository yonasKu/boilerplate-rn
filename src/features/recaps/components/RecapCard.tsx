import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { useRouter } from 'expo-router';
import RecapMediaGrid from './RecapMediaGrid';


const sampleData = {
    id: '1',
    media: [
        { type: 'image' as const, url: 'https://i.imgur.com/S8W7O4g.jpeg' },
        { type: 'image' as const, url: 'https://i.imgur.com/AD3G415.jpeg' },
        { type: 'image' as const, url: 'https://i.imgur.com/2MD3O5y.jpeg' },
        { type: 'image' as const, url: 'https://i.imgur.com/TzP1E9A.jpeg' },
        { type: 'image' as const, url: 'https://i.imgur.com/WbA4W5t.jpeg' },
    ],
    date: new Date('2025-07-15'),
    title: 'First steps, swim class, and big toddle...',
    age: '11 months, 3 days',
};

export const RecapCard = () => {
    const router = useRouter();

    const handlePress = () => {
        router.push({ pathname: '/recaps/recap-view', params: { recapId: sampleData.id } });
    };

    const formattedDate = {
        line1: 'WEEK OF',
        line2: sampleData.date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase(),
        line3: sampleData.date.getDate(),
        line4: sampleData.date.getFullYear(),
    };

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.card}>
                        <View style={styles.header}>
                <Image source={require('@/assets/images/two_stars_icon.png')} style={styles.sparkleIcon} />
                <Text style={styles.title} numberOfLines={1}>{sampleData.title}</Text>
            </View>
            <RecapMediaGrid media={sampleData.media} dateOverlay={formattedDate} />
            <View style={styles.footer}>
                <Text style={styles.ageText}>{sampleData.age}</Text>
                <View style={styles.footerIcons}>
                    <Ionicons name="heart-outline" size={24} color={Colors.darkGrey} />
                    <Ionicons name="trophy-outline" size={22} color={Colors.darkGrey} style={{ marginHorizontal: 16 }} />
                    <Ionicons name="chatbubble-outline" size={22} color={Colors.darkGrey} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 24,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sparkleIcon: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.black,
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 4,
    },
    ageText: {
        fontSize: 14,
        color: Colors.darkGrey,
        fontWeight: '500',
    },
    footerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
