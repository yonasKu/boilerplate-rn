import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MediaGrid from './MediaGrid';
import { Colors } from '../../../theme/colors';
import { calculateChildAgeAtDate } from '@/services/journalService';
import { getChild } from '@/services/childService';

// This is a simplified version of the entry prop for the preview
interface JournalEntryPreviewCardProps {
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
    childIds?: string[];
  };
  selectedChildId?: string;
  onLike?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleMilestone?: () => void;
  onPress?: () => void;
  headerTitle?: string; // e.g., "Today's entry"
  showEditIcon?: boolean;
  headerTitleStyle?: TextStyle;
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

const JournalEntryPreviewCard: React.FC<JournalEntryPreviewCardProps> = ({
  entry,
  selectedChildId = Array.isArray(entry.childIds) && entry.childIds.length > 0 ? entry.childIds[0] : '',
  onLike,
  onShare,
  onEdit,
  onDelete,
  onToggleMilestone,
  onPress,
  headerTitle = "Today's entry",
  showEditIcon = true,
  headerTitleStyle,
}) => {
  const isLiked = entry.isFavorited;
  const formattedDate = formatDate(entry.createdAt);
  const entryDate = useMemo(() => (entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt)), [entry.createdAt]);
  const [computedAge, setComputedAge] = useState<string>('');
  const [childAgeLabels, setChildAgeLabels] = useState<string[]>([]);

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
          setComputedAge('');
          return;
        }
        const ageStr = calculateChildAgeAtDate(dob, entryDate);
        if (!isCancelled) setComputedAge(ageStr);
      } catch (e) {
        if (!isCancelled) setComputedAge('');
      }
    };
    computeAge();
    return () => {
      isCancelled = true;
    };
  }, [selectedChildId, entryDate]);

  // Build labels for multiple children: "Name — age" joined by bullets
  useEffect(() => {
    const loadChildLabels = async () => {
      if (!entry || !Array.isArray(entry.childIds) || entry.childIds.length === 0) {
        setChildAgeLabels([]);
        return;
      }
      try {
        const results = await Promise.all(
          entry.childIds.map(async (id) => {
            try {
              const c = await getChild(id);
              const age = entry.childAgeAtEntry?.[id] ?? '';
              if (c?.name && age) return `${c.name} — ${age}`;
              if (age) return age;
              return null;
            } catch {
              return null;
            }
          })
        );
        setChildAgeLabels(results.filter((x): x is string => Boolean(x)));
      } catch (e) {
        setChildAgeLabels([]);
      }
    };
    loadChildLabels();
  }, [entry?.id, JSON.stringify(entry?.childIds)]);

  const childAge = computedAge || (selectedChildId && entry.childAgeAtEntry && entry.childAgeAtEntry[selectedChildId]
    ? entry.childAgeAtEntry[selectedChildId]
    : '');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.card}>
        {/* Header row */}
        {headerTitle ? (
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, headerTitleStyle]} numberOfLines={1} ellipsizeMode="tail">{headerTitle}</Text>
            {showEditIcon && onEdit ? (
              <TouchableOpacity onPress={onEdit} style={styles.headerEditBtn}>
                <Image source={require('@/assets/images/edit-2_icon.png')} style={styles.headerEditIcon} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Top section copied from JournalEntryCard */}
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

        {/* Media grid */}
        <MediaGrid media={entry.media} />

        {/* Footer actions copied from JournalEntryCard */}
        <View style={styles.footerActions}>
          <View style={[styles.ageContainer, styles.ageContainerFixed]}>
            {childAgeLabels.length > 0 ? (
              <View>
                {childAgeLabels.map((label, idx) => (
                  <Text key={idx} style={styles.childAge}>{label}</Text>
                ))}
              </View>
            ) : childAge ? (
              <Text style={styles.childAge}>{childAge}</Text>
            ) : null}
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

const childDobCache = new Map<string, Date>();

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  headerEditBtn: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: Colors.lightPink,
  },
  headerEditIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.grey,
  },
  topSection: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  dateContainer: {
    alignItems: 'flex-end',
    marginRight: 6,
    paddingHorizontal: 8,
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
  ageContainerFixed: {
    width: '70%',
    flexShrink: 1,
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
  milestoneGlow: {
    textShadowColor: Colors.golden,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
});

export default JournalEntryPreviewCard;
