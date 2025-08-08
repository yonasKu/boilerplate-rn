import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JournalEntryCardProps {
  entry: {
    id: string;
    text: string;
    media: Array<{
      type: 'image' | 'video';
      url: string;
      thumbnailUrl?: string;
    }>;
    isFavorited: boolean;
    isMilestone: boolean;
    childAgeAtEntry: string;
    likes: Record<string, boolean>;
    createdAt: any;
  };
  onLike?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isPreview?: boolean;
}

const formatDate = (date: any) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onLike, onShare, onEdit, onDelete, isPreview = false }) => {
  // Check if current user has liked this entry by looking at the likes object
  // This requires the current user ID, but since we don't have it here, we'll use isFavorited
  // The backend should sync isFavorited with the likes object for the current user
  const isLiked = entry.isFavorited;

  const handleLongPress = () => {
    if (isPreview) return;

    const options = ['Edit', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            onEdit?.();
          } else if (buttonIndex === destructiveButtonIndex) {
            onDelete?.();
          }
        }
      );
    } else {
      // Android uses a different approach, typically a modal or a different library
      Alert.alert(
        'Choose an action',
        '',
        [
          { text: 'Edit', onPress: () => onEdit?.() },
          { text: 'Delete', onPress: () => onDelete?.(), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const renderMedia = () => {
    if (!entry.media || entry.media.length === 0) return null;

    const mediaToDisplay = entry.media.slice(0, 2);

    if (mediaToDisplay.length === 1) {
      const item = mediaToDisplay[0];
      return (
        <View style={styles.mediaContainerFullWidth}>
          <Image source={{ uri: item.type === 'video' ? item.thumbnailUrl : item.url }} style={styles.mediaFullWidth} />
          {item.type === 'video' && (
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={48} color="white" />
            </View>
          )}
        </View>
      );
    }

    if (mediaToDisplay.length === 2) {
      return (
        <View style={styles.mediaContainerDouble}>
          {mediaToDisplay.map((item, index) => (
            <View key={index} style={styles.mediaHalfContainer}>
              <Image source={{ uri: item.type === 'video' ? item.thumbnailUrl : item.url }} style={styles.mediaHalfWidth} />
              {item.type === 'video' && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={32} color="white" />
                </View>
              )}
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <Pressable onLongPress={handleLongPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.dateText}>{formatDate(entry.createdAt)}</Text>
          <View style={styles.actions}>
            {onLike && (
              <TouchableOpacity onPress={onLike} style={styles.actionButton}>
                <Ionicons 
                  name={isLiked ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={isLiked ? '#FF6B6B' : '#666'} 
                />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.actionButton}>
                <Image 
                  source={require('@/assets/images/Share_icon.png')} 
                  style={styles.shareIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.entryText}>{entry.text}</Text>
        {renderMedia()}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#000000',
    
    marginBottom: 16,
  },
  mediaContainerFullWidth: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  mediaFullWidth: {
    width: '100%',
    height: '100%',
  },
  mediaContainerDouble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 150,
  },
  mediaHalfContainer: {
    width: '49%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  mediaHalfWidth: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  shareIcon: {
    width: 24,
    height: 24,
  },
});

export default JournalEntryCard;
