import React from 'react';
import { View, ScrollView, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/theme';
import HomeHeader from '../components/HomeHeader';
import WeekNavigator from '../../journal/components/WeekNavigator';
import WeeklyRecapPreviewCard from '../components/WeeklyRecapPreviewCard';
import ShareWithLovedOnesCard from '../components/ShareWithLovedOnesCard';
import RecentActivityCard from '../components/RecentActivityCard';
import StartJournalCard from '../components/StartJournalCard';
import { useJournal } from '@/hooks/useJournal';
import JournalEntryPreviewCard from '@/features/journal/components/JournalEntryPreviewCard';
import ShareBottomSheet from '@/features/journal/components/ShareBottomSheet';
import ActionCallout from '@/components/ui/ActionCallout';
import { useRouter } from 'expo-router';


const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { entries, isLoading, updateEntry, toggleLike } = useJournal();
  const latest = entries && entries.length > 0 ? entries[0] : null;
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [shareEntry, setShareEntry] = React.useState<any>(null);

  const isSameDay = (a?: any, b?: Date) => {
    if (!a || !b) return false;
    const d = a?.toDate ? a.toDate() : new Date(a);
    return d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate();
  };
  const today = new Date();
  const hasToday = Array.isArray(entries) && entries.some(e => isSameDay(e.createdAt, today));
  const todaysLatest = hasToday ? (entries || []).find(e => isSameDay(e.createdAt, today)) : null;
  // Most recent entry that is NOT today
  const latestNonToday = !hasToday
    ? (entries || []).filter((e: any) => !isSameDay(e.createdAt, today))[0] || null
    : null;

  // Compute this week's entry count (Sun-Sat)
  const startOfWeek = (d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const dow = date.getDay(); // 0=Sun
    date.setDate(date.getDate() - dow);
    return date;
  };
  const endOfWeek = (start: Date) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(weekStart);
  const countThisWeek = (entries || []).filter((e: any) => {
    const d = e?.createdAt?.toDate ? e.createdAt.toDate() : new Date(e?.createdAt);
    if (!d || Number.isNaN(d.getTime())) return false;
    return d >= weekStart && d <= weekEnd;
  }).length;
  const hasEntriesThisWeek = countThisWeek > 0;
  const completedWeekly = countThisWeek >= 3;
  const handleShare = (entry: any) => {
    setShareEntry(entry);
    setShowShareModal(true);
  };

  const handleShareAction = async (platform: 'copy' | 'system') => {
    if (!shareEntry) return;
    try {
      const message = shareEntry?.aiGenerated
        ? `Check out this recap on SproutBook: ${shareEntry.aiGenerated.recapText || shareEntry.aiGenerated.summary || ''}`
        : `Check out this memory from SproutBook: ${shareEntry.text || ''}`;

      if (platform === 'copy') {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied to clipboard');
      } else {
        await Share.share({ message });
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing entry:', error);
    }
  };
  return (
    <View style={styles.root}>
      <View style={styles.headerGroup}>
        <HomeHeader />
        <WeekNavigator />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top CTA:
            - If no entries: Start card
            - Else if user hasn't posted today: show "Add today's entry" callout
            - Else: hide
        */}
        {(!latest && !isLoading) ? (
          <StartJournalCard />
        ) : latest && !hasToday ? (
          <ActionCallout
            title="Add today's entry"
            description="What made you smile today? Take 30 seconds to add today's entry."
            ctaLabel="Add memory"
            onPress={() => router.push('/(main)/new-entry')}
            dateBadge={today}
            backgroundColor={Colors.lightPink2}
          />
        ) : null}

        {/* Show only today's entry as a preview card when user posted today. Do not show older latest entries. */}
        {hasToday && todaysLatest ? (
          <JournalEntryPreviewCard
            entry={todaysLatest as any}
            headerTitle="Today's entry"
            showEditIcon
            onEdit={() => router.push({ pathname: '/(main)/new-entry', params: { entryId: todaysLatest.id } })}
            onPress={() => router.push(`/(main)/journal/${todaysLatest.id}` as any)}
            onLike={() => toggleLike(todaysLatest.id)}
            onToggleMilestone={() => updateEntry(todaysLatest.id, { isMilestone: !todaysLatest.isMilestone })}
            onShare={() => handleShare(todaysLatest)}
          />
        ) : null}

        {/* Weekly completion callout (middle). Only show if user posted this week. */}
        {hasEntriesThisWeek && (
          completedWeekly ? (
            <ActionCallout
              title={"You're all caught up!"}
              description="Come back tomorrow to capture more memories."
              success
              backgroundColor={Colors.lightPink2}
            />
          ) : (
            <ActionCallout
              title="Catch up on this week"
              description={"Don't miss out on this week's recap — get caught up now."}
              ctaLabel="Add memories"
              onPress={() => router.push('/(main)/new-entry')}
              iconName="time-outline"
              backgroundColor={Colors.lightPink2}
            />
          )
        )}

        <WeeklyRecapPreviewCard onShare={(recap) => handleShare(recap)} />

        <ShareBottomSheet
          isVisible={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShare={handleShareAction}
        />

        {/* Look-back preview (when no entry today, show the most recent past entry) */}
        {!hasToday && latestNonToday ? (
          <JournalEntryPreviewCard
            entry={latestNonToday as any}
            headerTitle="Take a look back"
            headerTitleStyle={{ fontFamily: 'Poppins_500Medium' }}
            onPress={() => router.push(`/(main)/journal/${latestNonToday.id}` as any)}
            onEdit={() => router.push(`/(main)/new-entry?entryId=${latestNonToday.id}` as any)}
            onLike={() => toggleLike(latestNonToday.id)}
            onToggleMilestone={() => updateEntry(latestNonToday.id, { isMilestone: !latestNonToday.isMilestone })}
            onShare={() => handleShare(latestNonToday)}
          />
        ) : null}
        <ShareWithLovedOnesCard />
        <RecentActivityCard />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.offWhite
  },
  content: {
    backgroundColor: Colors.offWhite,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  headerGroup: {
    // No gap here so header and week navigator stick together
  },
});

export default HomeScreen;
