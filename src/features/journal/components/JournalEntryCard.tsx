import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../theme/colors';

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
  onPress?: () => void;
  isPreview?: boolean;
}

const formatDate = (date: any) => {
  if (!date) return { dayOfWeek: '', day: '', month: '' };
  const d = date.toDate ? date.toDate() : new Date(date);
  return {
    dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
};

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onLike, onShare, onEdit, onDelete, onPress, isPreview = false }) => {
  const isLiked = entry.isFavorited;
  const formattedDate = formatDate(entry.createdAt);

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

    const media = entry.media;
    const mediaCount = media.length;

    const renderImage = (item: any, style: any, key: any) => (
      <View key={key} style={style}>
        <Image source={{ uri: item.url }} style={styles.mediaImage} />
      </View>
    );

    const rightColumnImages = media.slice(1, 5);

    return (
      <View style={styles.mediaGridContainer}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          {renderImage(media[0], styles.fullHeightImage, 'left-img')}
        </View>

        {/* Right Column */}
        {mediaCount > 1 && (
          <View style={styles.rightColumn}>
            {rightColumnImages.map((item, index) => {
              if (mediaCount >= 5 && index === 3) {
                return (
                  <View key={`right-img-${index}`} style={styles.rightGridItem}>
                    <Image source={{ uri: item.url }} style={styles.mediaImage} />
                    <View style={styles.overlay}>
                      <Text style={styles.overlayText}>+{mediaCount - 4}</Text>
                    </View>
                  </View>
                );
              }
              return renderImage(item, styles.rightGridItem, `right-img-${index}`);
            })}
          </View>
        )}
      </View>
    );
  };

  return (
        <Pressable onPress={onPress} onLongPress={handleLongPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
              <View style={styles.card}>
        <View style={styles.topSection}>

          <View style={styles.contentContainer}>
            <View style={styles.headerActions}>
              {entry.isMilestone && (
                <Ionicons name="trophy-outline" size={20} color={Colors.primary} style={styles.actionIcon} />
              )}
              {onLike && (
                <TouchableOpacity onPress={onLike}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isLiked ? Colors.error : Colors.mediumGrey}
                    style={styles.actionIcon}
                  />
                </TouchableOpacity>
              )}
              {onShare && (
                <TouchableOpacity onPress={onShare} style={styles.actionIcon}>
                  <Image
                    source={require('@/assets/images/Share_icon.png')}
                    style={styles.shareIcon}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', flexShrink: 1, width: '100%' ,overflow:'hidden',alignItems:'center'}}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateDayOfWeek}>{formattedDate.dayOfWeek}</Text>
                <Text style={styles.dateDay}>{formattedDate.day}</Text>
                <Text style={styles.dateMonth}>{formattedDate.month}</Text>
              </View>
              <Text style={styles.entryText} numberOfLines={4}>{entry.text}</Text>
            </View>
          </View>
        </View>
        {renderMedia()}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F6F4',
    borderRadius: 16,
    overflow: 'hidden',
  },
  topSection: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  dateContainer: {
    alignSelf:'flex-start',
    alignItems: 'flex-end',
    //justifyContent: 'center',
    marginRight: 6,
    paddingHorizontal: 8,
    //width: 50,
  },
  dateDayOfWeek: {
    fontSize: 12,
    color: Colors.darkGrey,
    fontFamily: 'Poppins',
    lineHeight: 14,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    fontFamily: 'Poppins',
    lineHeight: 24,
  },
  dateMonth: {
    fontSize: 10,
    color: Colors.darkGrey,
    fontFamily: 'Poppins',
    lineHeight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  actionIcon: {
    marginLeft: 12,
  },
  shareIcon: {
    width: 22,
    height: 22,
  },
  entryText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.darkGrey,
    fontFamily: 'Poppins',
  },
  mediaGridContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    height: 220, // Set a fixed height for the container
  },
  leftColumn: {
    flex: 1,
    padding: 2,
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fullHeightImage: {
    width: '100%',
    height: '100%',
  },
  rightGridItem: {
    width: '50%',
    height: '50%',
    padding: 2,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    marginVertical: 5,  
    backgroundColor: 'rgba(46, 139, 87, 0.3)', // Green overlay
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  overlayText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
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
});

export default JournalEntryCard;
