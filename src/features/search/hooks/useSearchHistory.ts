import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (history: SearchHistoryItem[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const addSearchQuery = async (query: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
    };

    const updatedHistory = [
      newItem,
      ...searchHistory.filter(item => item.query.toLowerCase() !== query.trim().toLowerCase()),
    ].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(updatedHistory);
    await saveSearchHistory(updatedHistory);
  };

  const removeSearchQuery = async (query: string) => {
    const updatedHistory = searchHistory.filter(item => item.query !== query);
    setSearchHistory(updatedHistory);
    await saveSearchHistory(updatedHistory);
  };

  const clearSearchHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return {
    searchHistory,
    addSearchQuery,
    removeSearchQuery,
    clearSearchHistory,
  };
};
