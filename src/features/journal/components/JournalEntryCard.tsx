import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MediaGrid from './MediaGrid';
import { Colors } from '../../../theme/colors';
import { calculateChildAgeAtDate } from '@/services/journalService';
import { getChild } from '@/services/childService';

// Simple in-module cache to avoid re-fetching DOB for the same childId
const childDobCache = new Map<string, Date>();

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
    childAgeAtEntry: Record<string, string>;
    likes: Record<string, boolean>;
    createdAt: any;
  };
  selectedChildId: string;
  onLike?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleMilestone?: () => void;
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

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, selectedChildId, onLike, onShare, onEdit, onDelete, onToggleMilestone, onPress, isPreview = false }) => {
  const isLiked = entry.isFavorited;
  const formattedDate = formatDate(entry.createdAt);
  const entryDate = useMemo(() => (entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt)), [entry.createdAt]);
  const [computedAge, setComputedAge] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    const computeAge = async () => {
      if (!selectedChildId || !entryDate) {
        setComputedAge('');
        return;
      }

      try {
        let dob = childDobCache.get(selectedChildId);
        if (!dob) {
          const child = await getChild(selectedChildId);
          if (child?.dateOfBirth) {
            dob = child.dateOfBirth;
            childDobCache.set(selectedChildId, dob);
          }
        }
        if (!dob) {
          // No DOB available; rely on stored age if any
          setComputedAge('');
          return;
        }
        const ageStr = calculateChildAgeAtDate(dob, entryDate);
        if (!isCancelled) setComputedAge(ageStr);
      } catch (e) {
        // Fallback to stored value on error
        if (!isCancelled) setComputedAge('');
      }
    };

    computeAge();
    return () => {
      isCancelled = true;
    };
  }, [selectedChildId, entryDate]);
  
  // Display age for the selected child
  const childAge = computedAge || (selectedChildId && entry.childAgeAtEntry && entry.childAgeAtEntry[selectedChildId]
    ? entry.childAgeAtEntry[selectedChildId]
    : '');

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



  return (
    <Pressable onPress={onPress} onLongPress={handleLongPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.card}>
        <View style={styles.topSection}>

          <View style={styles.contentContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, width: '100%', minWidth: 0 }}>
              <View style={[styles.dateContainer, { width: 60 }]}>
                <Text style={styles.dateDayOfWeek}>{formattedDate.dayOfWeek}</Text>
                <Text style={styles.dateDay}>{formattedDate.day}</Text>
                <Text style={styles.dateMonth}>{formattedDate.month}</Text>
              </View>
              <Text style={[styles.entryText, { flexShrink: 1, flexGrow: 1, minWidth: 0 }]} numberOfLines={3} ellipsizeMode="tail">{entry.text}</Text>
            </View>
          </View>
        </View>
        <MediaGrid media={entry.media} />
        <View style={styles.footerActions}>
          <View style={styles.ageContainer}>
            {childAge ? <Text style={styles.childAge}>{childAge}</Text> : null}
          </View>
          <View style={styles.actionButtons}>

            {onLike && (
              <TouchableOpacity onPress={onLike}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isLiked ? '#F68B7F' : Colors.lightGrey}
                  style={styles.actionIcon}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onToggleMilestone}>
              <Ionicons
                name={entry.isMilestone ? 'trophy' : 'trophy-outline'}
                size={19}
                color={entry.isMilestone ? Colors.golden : Colors.lightGrey}
                style={[styles.actionIcon, entry.isMilestone && styles.milestoneGlow]}
              />
            </TouchableOpacity>
            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.actionIcon}>
                <Image
                  source={require('@/assets/images/Share_icon.png')}
                  style={styles.shareIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Pressable>
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
  topSection: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  dateContainer: {
    // alignSelf: 'center',
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
    letterSpacing: 3.5,
    lineHeight: 10,
  },
  dateDay: {
    fontSize: 20,
    color: Colors.black,
    fontFamily: 'Poppins',
    lineHeight: 36,
  },
  dateMonth: {
    fontSize: 12,
    color: Colors.darkGrey,
    fontFamily: 'Poppins',
    lineHeight: 10,
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
  },
  footerActions: {
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionIcon: {
    marginLeft: 12,
  },
  shareIcon: {
    width: 22,
    height: 22,
    tintColor: Colors.lightGrey,
  },
  ageContainer: {
    flex: 1,
  },
  childAge: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.lightGrey,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.darkGrey,
    fontFamily: 'Poppins',
    textAlign: 'left',
    marginLeft: 0,
    flex: 1,
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
  milestoneGlow: {
    // Add subtle glow effect when milestone is active
    textShadowColor: Colors.golden,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
});

export default JournalEntryCard;
