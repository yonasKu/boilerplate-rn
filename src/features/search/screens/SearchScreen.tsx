import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useJournal } from '@/hooks/useJournal';
import JournalEntryCard from '@/features/journal/components/JournalEntryCard';
import JournalEntryPreviewCard from '@/features/journal/components/JournalEntryPreviewCard';

const SearchScreen = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const insets = useSafeAreaInsets();
  const { entries } = useJournal();

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchText.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return [];
    const res = entries.filter(e =>
      e.title?.toLowerCase().includes(debouncedQuery) ||
      e.text?.toLowerCase().includes(debouncedQuery) ||
      e.tags?.some((t: string) => t.toLowerCase().includes(debouncedQuery))
    );
    console.log('Search:', debouncedQuery, '=>', res.length, 'matches');
    return res;
  }, [entries, debouncedQuery]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="chevron-back" size={22} color="#000" />
          </View>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A9A9A9" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search"
          />
        </View>
      </View>
      {debouncedQuery ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/journal/${item.id}` as any)}>
              <JournalEntryPreviewCard entry={item} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.resultsText}>
              Found {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{debouncedQuery}"
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No entries found for "{debouncedQuery}"</Text>
          }
        />
      ) : null}
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
});

export default SearchScreen;
