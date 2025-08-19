import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import { useRouter } from 'expo-router';
import RecapMediaGrid from './RecapMediaGrid';
import { Recap, RecapService } from '../../../services/aiRecapService';
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

    // Debug logging for recap data
    console.log('RecapCard - Full recap data:', recap);
    console.log('RecapCard - recap.media:', recap.media);
    console.log('RecapCard - recap.media?.highlightPhotos:', recap.media?.highlightPhotos);
    console.log('RecapCard - recap.summary?.media?.highlightPhotos:', recap.summary?.media?.highlightPhotos);
    
    // Use highlightPhotos directly from recap data, fallback to summary.media.highlightPhotos
    const highlightPhotos = (recap.media?.highlightPhotos && recap.media?.highlightPhotos?.length > 0) 
      ? recap.media.highlightPhotos 
      : recap.summary?.media?.highlightPhotos || [];
    console.log('RecapCard - highlightPhotos (final):', highlightPhotos);
    console.log('RecapCard - highlightPhotos length:', highlightPhotos.length);

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

    const handleMilestoneToggle = async () => {
        if (!recap.id || !auth.currentUser?.uid) return;
        
        const newMilestoneStatus = !isMilestone;
        
        try {
            // Optimistic UI update
            setIsMilestone(newMilestoneStatus);
            
            await RecapService.tagRecap(recap.id, { isMilestone: newMilestoneStatus });
        } catch (error) {
            // Revert on error
            setIsMilestone(!newMilestoneStatus);
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
                
                // Load milestone status from Firestore
                const recaps = await RecapService.getRecaps(auth.currentUser!.uid);
                const currentRecap = recaps.find(r => r.id === recap.id);
                const milestoneStatus = (currentRecap as any)?.isMilestone || false;
                setIsMilestone(milestoneStatus);
            } catch (error) {
                console.error('Error loading card data:', error);
            }
        };
        
        loadCardData();
    }, [recap.id]);

    const displayDate = recap.createdAt || recap.period?.endDate;

    const formattedDate = displayDate ? {
        line1: 'WEEK OF',
        line2: displayDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase(),
        line3: displayDate.getDate(),
        line4: displayDate.getFullYear(),
    } : undefined;
    
    const age = '11 months, 3 days'; // TODO: Calculate from recap data

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.card}>
            <View style={styles.header}>
                <Image source={require('@/assets/images/two_stars_icon.png')} style={styles.sparkleIcon} />
                <Text style={styles.title} numberOfLines={1}>{recap.aiGenerated.recapText || recap.aiGenerated.summary || 'Recap'}</Text>
            </View>
            <RecapMediaGrid media={highlightPhotos?.map((url: string) => ({ url, type: 'image' as const })) ?? []} dateOverlay={formattedDate} />
            <View style={styles.footer}>
                <Text style={styles.ageText}>{age}</Text>
                <View style={styles.footerIcons}>
                    <TouchableOpacity onPress={handleLikePress} style={styles.iconButton}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? Colors.red : Colors.grey} />
                        {likesCount > 0 && <Text style={styles.countText}>{likesCount}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleMilestoneToggle} style={styles.iconButton}>
                        <Ionicons name={isMilestone ? "trophy" : "trophy-outline"} size={20} color={isMilestone ? Colors.golden : Colors.grey} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCommentsPress} style={styles.iconButton}>
                        <Image 
                            source={require('@/assets/images/message_icon.png')} 
                            style={styles.messageIcon}
                            resizeMode="contain"
                        />
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
        borderRadius: 16,
        overflow: 'hidden',
        padding: 4,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.lightGrey,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.41,
        elevation: 2,
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
       
        flex: 1,
        lineHeight: 20,
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
        marginLeft: 0,
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    countText: {
        fontSize: 12,
        color: Colors.grey,
        marginLeft: 4,
        fontWeight: '500',
    },
    messageIcon: {
        width: 20,
        height: 20,
        tintColor: Colors.grey,
    },
    redDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.red,
    },
    shareIcon: {
        marginLeft: 12,
    },
});
