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
import { FamilyService } from '@/services/familyService';
import { useAccount } from '@/context/AccountContext';


const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isFullAccount } = useAccount();
  const { entries, isLoading, updateEntry, toggleLike } = useJournal();
  const latest = entries && entries.length > 0 ? entries[0] : null;
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [shareEntry, setShareEntry] = React.useState<any>(null);

  // Debug: Log account status on mount to verify backend classification
  React.useEffect(() => {
    (async () => {
      try {
        const status = await FamilyService.getAccountStatus();
        console.log('[HomeScreen] AccountStatus:', status);
      } catch (e) {
        console.error('[HomeScreen] getAccountStatus error:', e);
      }
    })();
  }, []);

  const toJsDate = (v: any | undefined | null): Date | null => {
    if (!v) return null;
    const d = v?.toDate ? v.toDate() : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const getEntryDate = (e: any): Date | null => {
    return toJsDate(e?.occurredAt) || toJsDate(e?.createdAt);
  };
  const isSameDay = (a?: Date | null, b?: Date | null) => {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };
  const today = new Date();
  // Sort entries by occurredAt (fallback createdAt) desc to make selection deterministic
  const sortedByWhen = Array.isArray(entries)
    ? [...entries].sort((a, b) => {
        const ad = getEntryDate(a)?.getTime() ?? 0;
        const bd = getEntryDate(b)?.getTime() ?? 0;
        return bd - ad;
      })
    : [];

  const hasToday = sortedByWhen.some(e => isSameDay(getEntryDate(e), today));
  const todaysLatest = hasToday ? sortedByWhen.find(e => isSameDay(getEntryDate(e), today)) : null;
  // Most recent entry that is NOT today; if none in last 7 days, still pick the most recent past entry
  const nonToday = sortedByWhen.filter(e => !isSameDay(getEntryDate(e), today));
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const latestPastWeek = nonToday.find(e => {
    const d = getEntryDate(e);
    return d != null && d >= sevenDaysAgo;
  });
  const latestNonToday = latestPastWeek || (nonToday.length > 0 ? nonToday[0] : null);

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
  const showAddToday = !!latest && !hasToday;
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
        {/* Top CTA (owner-only) */}
        {isFullAccount ? (
          (!latest && !isLoading) ? (
            <StartJournalCard />
          ) : showAddToday ? (
            <ActionCallout
              title={"Add today's entry"}
              description="What made you smile today? Take 30 seconds to add today's entry."
              ctaLabel="Add memory"
              onPress={() => router.push('/(main)/new-entry')}
              dateBadge={today}
              backgroundColor={Colors.lightPink2}
            />
          ) : null
        ) : (
          // Viewer-specific prompt
          <ActionCallout
            title="Get your own journal"
            description="Create your private journal to add memories and recaps."
            ctaLabel="Create journal"
            onPress={() => router.push('/(auth)/pricing')}
            iconName="book-outline"
            backgroundColor={Colors.lightPink2}
          />
        )}

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

        {/* Weekly completion callout (owner-only). Only show if user posted this week. */}
        {isFullAccount && !showAddToday && hasEntriesThisWeek && (
          completedWeekly ? (
            <ActionCallout
              title={"You're all caught up!"}
              description="Come back tomorrow to capture more memories."
              success
              iconName="list-outline"
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

        {/* Look-back preview: always show a past entry when available */}
        {latestNonToday ? (
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
