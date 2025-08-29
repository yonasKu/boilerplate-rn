import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJournal } from '@/hooks/useJournal';
import { useAllRecaps } from '@/features/recaps/hooks/useAllRecaps';
import JournalEntryCard from '@/features/journal/components/JournalEntryCard';
import { RecapCard } from '@/features/recaps/components/RecapCard';
import { Colors } from '@/theme';

const SearchScreen = () => {
  const router = useRouter();
  const { q: queryParam } = useLocalSearchParams();
  const [searchText, setSearchText] = useState(queryParam?.toString() || '');
  const [activeTab, setActiveTab] = useState<'all' | 'entries' | 'recaps'>('all');
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();
  const { recaps } = useAllRecaps();

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchText.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (queryParam) {
      setSearchText(queryParam.toString());
    }
  }, [queryParam]);

  const filteredEntries = useMemo(() => {
    if (!debouncedQuery) return [];
    return entries.filter(e =>
      e.title?.toLowerCase().includes(debouncedQuery) ||
      e.text?.toLowerCase().includes(debouncedQuery) ||
      e.tags?.some((t: string) => t.toLowerCase().includes(debouncedQuery))
    );
  }, [entries, debouncedQuery]);

  const filteredRecaps = useMemo(() => {
    if (!debouncedQuery) return [];
    return recaps.filter((r: any) =>
      r.aiGenerated?.title?.toLowerCase().includes(debouncedQuery) ||
      r.aiGenerated?.recapText?.toLowerCase().includes(debouncedQuery) ||
      r.aiGenerated?.keyMoments?.some((m: string) => m.toLowerCase().includes(debouncedQuery)) ||
      r.childName?.toLowerCase().includes(debouncedQuery)
    );
  }, [recaps, debouncedQuery]);

  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];

    const results = [];

    if (activeTab === 'all' || activeTab === 'entries') {
      const entryResults = filteredEntries.map((entry: any) => ({
        id: `entry-${entry.id}`,
        type: 'entry',
        data: entry,
        title: entry.title || 'Untitled Entry',
        subtitle: entry.text?.substring(0, 100) || 'No content',
        date: entry.createdAt,
      }));
      results.push(...entryResults);
    }

    if (activeTab === 'all' || activeTab === 'recaps') {
      const recapResults = filteredRecaps.map((recap: any) => ({
        id: `recap-${recap.id}`,
        type: 'recap',
        data: recap,
        title: recap.aiGenerated?.title || `${recap.childName}'s ${recap.type} Recap`,
        subtitle: recap.aiGenerated?.recapText?.substring(0, 100) || 'No recap content',
        date: recap.createdAt,
      }));
      results.push(...recapResults);
    }

    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debouncedQuery, filteredEntries, filteredRecaps, activeTab]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="chevron-back" size={22} color="#000" />
          </View>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color="#A9A9A9" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search entries and recaps..."
          />
        </View>
      </View>

      {debouncedQuery ? (
        <>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              if (item.type === 'entry') {
                return (
                  <View style={styles.cardContainer}>
                    <JournalEntryCard 
                      entry={item.data} 
                      selectedChildId={item.data.childId || ''}
                      onLike={() => {}}
                      onShare={() => {}}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onToggleMilestone={() => {}}
                      onPress={() => router.push(`/journal/${item.data.id}` as any)}
                    />
                  </View>
                );
              } else {
                return (
                  <View style={styles.cardContainer}>
                    <TouchableOpacity onPress={() => router.push(`/recaps/recap-view?recapId=${item.data.id}` as any)}>
                      <RecapCard recap={item.data} onShare={() => { }} />
                    </TouchableOpacity>
                  </View>
                );
              }
            }}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <Text style={styles.resultsText}>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{debouncedQuery}"
              </Text>
            }
            ListEmptyComponent={
              <Text style={styles.empty}>No results found for "{debouncedQuery}"</Text>
            }
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#A9A9A9" />
          <Text style={styles.emptyStateText}>Search for journal entries and recaps</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.white,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.lightGrey,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.blacktext,
    fontFamily: 'Poppins-Regular',
    paddingVertical: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor:Colors.offWhite,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: Colors.blacktext,
    fontFamily: 'Poppins-Regular',
  },
  activeTabText: {
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
  resultsText: {
    fontSize: 16,
    color: Colors.blacktext,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  cardContainer: {
    marginHorizontal: 0,
    marginVertical: 8,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.blacktext,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.blacktext,
    fontFamily: 'Poppins-Regular',
  },
});

export default SearchScreen;
