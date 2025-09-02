import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/theme';
import { RecapCard } from '../../recaps/components/RecapCard';
import { Recap, RecapService } from '../../../services/aiRecapService';
import { useJournal } from '@/hooks/useJournal';
import { useAuth } from '@/context/AuthContext';

interface WeeklyRecapPreviewCardProps {
  onShare?: (recap: Recap) => void;
}

const WeeklyRecapPreviewCard: React.FC<WeeklyRecapPreviewCardProps> = ({ onShare }) => {
  // Pull journals and current user
  const { entries } = useJournal();
  const { user } = useAuth();

  // Fetch user's recaps to determine display state
  const [recaps, setRecaps] = useState<Recap[]>([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) return;
      try {
        const data = await RecapService.getRecaps(user.uid);
        if (mounted) setRecaps(data);
      } catch (e) {
        // Fail silently on home card
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const REQUIRED = 3; // Only applies to first-time users (no journals yet)
  const totalEntries = useMemo(() => (entries || []).length, [entries]);
  const hasAnyJournal = totalEntries > 0;
  const hasAnyRecap = (recaps || []).length > 0;
  const mostRecentRecap = hasAnyRecap ? recaps[0] : null;

  // Progress for brand-new users only
  const progressPct = Math.min(100, Math.max(0, Math.round((totalEntries / REQUIRED) * 100)));
  const remaining = Math.max(0, REQUIRED - totalEntries);

  // Exact RecapCard style with sample data
  const s1 = Image.resolveAssetSource(require('@/assets/images/sample.png')).uri;
  const s2 = Image.resolveAssetSource(require('@/assets/images/sample2.png')).uri;
  const sample = {
    id: 'sample-home-recap',
    userId: 'sample',
    childId: 'sample-child',
    type: 'weekly',
    period: {
      startDate: new Date(),
      endDate: new Date(),
    },
    aiGenerated: {
      recapText: 'First steps, swim class, and big toddler energy.',
      summary: 'A joyful week with lots of movement and smiles',
      keyMoments: [],
      tone: 'happy',
    },
    media: {
      // Pass URI strings expected by RecapCard/RecapMediaGrid
      highlightPhotos: [
        s1,
        s2,
      ],
    },
    status: 'completed',
    createdAt: new Date(),
    generatedAt: new Date(),
    isFavorited: false,
    isMilestone: false,
    likes: {},
    commentCount: 0,
  } as unknown as Recap;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {hasAnyJournal || hasAnyRecap ? (
              <View style={styles.iconBadge}>
                <Image source={require('@/assets/images/recaps_icon.png')} style={styles.recapIcon} />
              </View>
            ) : (
              <Image source={require('@/assets/images/two_stars_icon.png')} style={styles.sparkleIcon} />
            )}
            <Text style={styles.title}>
              {hasAnyRecap ? 'Most recent recap' : (hasAnyJournal ? 'Your sneak peek is ready' : "Preview this week's recap")}
            </Text>
          </View>
          {(!hasAnyRecap && !hasAnyJournal) && (
            <Image source={require('@/assets/images/lock_icon.png')} style={styles.lockIcon} />
          )}
        </View>
        <Text style={styles.subtitle}>
          {hasAnyRecap
            ? "Last week’s recap is ready to review, edit, and share with friends and family."
            : (hasAnyJournal ? 'Your sneak peek is ready—check it out now' : 'Add at least 3 entries to unlock a sneak peek!')}
        </Text>

        {(!hasAnyRecap && !hasAnyJournal) && (
          <>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{Math.min(totalEntries, REQUIRED)} of {REQUIRED} entries</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </>
        )}
      </View>
      <View style={styles.cardContainer}>
        {hasAnyRecap ? (
          <RecapCard
            recap={mostRecentRecap as Recap}
            onShare={() => {
              if (onShare && mostRecentRecap) onShare(mostRecentRecap);
            }}
          />
        ) : (
          <RecapCard recap={sample} onShare={() => {}} />
        )}
        {/* Blur overlay only for true first-time users (no journals) */}
        {(!hasAnyRecap && !hasAnyJournal) && (
          <BlurView intensity={90} tint="extraLight" style={styles.blurOverlay} />
        )}
        {/* Centered pill text */}
        {(!hasAnyRecap) && (
          <View style={styles.overlayCenter} pointerEvents={(hasAnyJournal) ? 'none' : 'auto'}>
            <View style={styles.overlayPill}>
              <Text style={styles.overlayText}>
                {hasAnyJournal ? 'See your sneak peek!' : `Complete ${remaining} more ${remaining === 1 ? 'entry' : 'entries'}`}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    borderRadius: 16,
  },
  cardContainer: {
    position: 'relative',
  },
  header: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIcon: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  lockIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.grey,
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: Colors.darkGrey,
  },
  subtitle: {
    color: Colors.darkGrey,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: Colors.darkGrey,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  progressValue: {
    color: Colors.grey,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  progressBg: {
    backgroundColor: Colors.offWhite,
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    backgroundColor: '#E87D7D',
    height: '100%',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  washOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  overlayCenter: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayPill: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    shadowColor: Colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  overlayText: {
    color: Colors.blacktext,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  iconBadge: {
    width: 33,
    height: 33,
    borderRadius: 14,
    backgroundColor: 'rgba(232, 125, 125, 0.12)', // light pinkish wash
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  recapIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.grey,
  },
});

export default WeeklyRecapPreviewCard;
