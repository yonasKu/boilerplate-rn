import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { useRouter } from 'expo-router';
import RecapMediaGrid from './RecapMediaGrid';
import { Recap } from '../../../services/aiRecapService';
import { recapInteractionService } from '../services/recapInteractionService';
import { auth } from '@/lib/firebase/firebaseConfig';

// Sample data commented out - now using real recap data
// const sampleData = {
//     id: '1',
//     media: [
//         { type: 'image' as const, url: 'https://i.imgur.com/S8W7O4g.jpeg' },
//         { type: 'image' as const, url: 'https://i.imgur.com/AD3G415.jpeg' },
//         { type: 'image' as const, url: 'https://i.imgur.com/2MD3O5y.jpeg' },
//     ],
//     date: new Date('2025-07-15'),
//     title: 'First steps, swim class, and big toddle...',
//     age: '11 months, 3 days',
// };

interface RecapCardProps {
    recap: Recap;
    onShare: () => void;
}

export const RecapCard: React.FC<RecapCardProps> = ({ recap, onShare }) => {
    const router = useRouter();
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isMilestone, setIsMilestone] = useState(false);

    console.log('--- RecapCard ---');
    console.log('Recap data:', JSON.stringify(recap, null, 2));

    const handlePress = () => {
        router.push({ pathname: '/recaps/recap-view', params: { recapId: recap.id } });
    };

    const handleCommentsPress = () => {
        router.push({ pathname: '/recaps/recap-view', params: { recapId: recap.id, openComments: 'true' } });
    };

    const handleLikePress = async () => {
        if (!recap.id || !auth.currentUser?.uid) return;
        
        try {
            const newLikeStatus = await recapInteractionService.toggleLike(recap.id, auth.currentUser.uid);
            setIsLiked(newLikeStatus);
            setLikesCount(prev => newLikeStatus ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    React.useEffect(() => {
        if (!recap.id || !auth.currentUser?.uid) return;
        
        const loadCardData = async () => {
            try {
                const [liked, count] = await Promise.all([
                    recapInteractionService.isLikedByUser(recap.id!, auth.currentUser!.uid),
                    recapInteractionService.getLikesCount(recap.id!)
                ]);
                setIsLiked(liked);
                setLikesCount(count);
                setIsMilestone((recap as any).isMilestone || false);
            } catch (error) {
                console.error('Error loading card data:', error);
            }
        };
        
        loadCardData();
    }, [recap.id]);

    const formattedDate = {
        line1: 'WEEK OF',
        line2: recap.createdAt.toLocaleDateString('en-US', { month: 'long' }).toUpperCase(),
        line3: recap.createdAt.getDate(),
        line4: recap.createdAt.getFullYear(),
    };
    
    const age = '11 months, 3 days'; // TODO: Calculate from recap data

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.card}>
            <View style={styles.header}>
                <Image source={require('@/assets/images/two_stars_icon.png')} style={styles.sparkleIcon} />
                <Text style={styles.title} numberOfLines={3}>{recap.aiGenerated.recapText || recap.aiGenerated.summary || 'Recap'}</Text>
            </View>
            <RecapMediaGrid media={recap.media?.highlightPhotos?.map((url: string) => ({ url, type: 'image' as const })) ?? []} dateOverlay={formattedDate} />
            <View style={styles.footer}>
                <Text style={styles.ageText}>{age}</Text>
                <View style={styles.footerIcons}>
                    <TouchableOpacity onPress={handleLikePress} style={styles.iconButton}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? Colors.red : Colors.grey} />
                        {likesCount > 0 && <Text style={styles.countText}>{likesCount}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name={isMilestone ? "trophy" : "trophy-outline"} size={20} color={isMilestone ? Colors.golden : Colors.grey} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCommentsPress} style={styles.iconButton}>
                        <Ionicons name="chatbubble-outline" size={20} color={Colors.grey} />
                        {(recap as any).commentCount > 0 && <Text style={styles.countText}>{(recap as any).commentCount}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onShare} style={styles.actionIcon}>
                        <Ionicons name="arrow-redo-outline" size={20} color={Colors.grey} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
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
        marginTop: 4,
        paddingVertical: 6,
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
        color: Colors.blacktext,
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
        color: Colors.lightGrey,
        fontWeight: '500',
    },
    footerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        marginLeft: 16,
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    countText: {
        fontSize: 12,
        color: Colors.grey,
        marginLeft: 4,
        fontWeight: '500',
    },
    shareIcon: {
        width: 22,
        height: 22,
        tintColor: Colors.grey,
    },
    messageIcon: {
        width: 20,
        height: 20,
        tintColor: Colors.grey,
    },
});
