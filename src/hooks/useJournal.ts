// src/hooks/useJournal.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as journalService from '@/services/journalService';
import { DocumentData } from 'firebase/firestore';

export interface JournalEntry extends DocumentData {
  id: string;
  userId: string;
  childIds: string[]; // Multi-child support only
  text: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
  }>;
  isFavorited: boolean;
  isMilestone: boolean;
  childAgeAtEntry: Record<string, string>; // Map of childId to age string
  likes: Record<string, boolean>;
  occurredAt: any; // Firestore timestamp representing when the event happened
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

export const useJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch entries when the hook is used
  useEffect(() => {
    if (user) {
      journalService.fetchUserJournalEntries(user.uid)
        .then(setEntries)
        .catch(() => setError('Failed to fetch journal entries.'))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  // Function to add a new entry
  const addEntry = async (entryData: {
    text: string;
    media: Array<{ uri: string; type: 'image' | 'video' }>;
    isFavorited: boolean;
    isMilestone: boolean;
    childIds: string[];
    childAgeAtEntry: Record<string, string>;
    occurredAt: Date;
  }): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    setIsLoading(true);
    try {
      // 1. Upload all media from local URIs
      const mediaUrls = await Promise.all(
        entryData.media.map(async (item) => ({
          type: item.type,
          url: await journalService.uploadMedia(item.uri, item.type),
        }))
      );
      
      // 2. Create the entry with the returned URLs
      const newEntryId = await journalService.createJournalEntry({
        userId: user.uid,
        ...entryData,
        media: mediaUrls,
      });

      // 3. Refresh local state (optional, for immediate UI update)
      const updatedEntries = await journalService.fetchUserJournalEntries(user.uid);
      setEntries(updatedEntries);
      
      // 4. Return the newly created entry ID for navigation
      return newEntryId;

    } catch (e) {
      setError('Failed to save entry.');
      throw e; // Re-throw to be caught in the component
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update an existing entry
  const updateEntry = async (entryId: string, updates: {
    text?: string;
    media?: Array<{ type: 'image' | 'video'; url: string; thumbnailUrl?: string }>;
    isFavorited?: boolean;
    isMilestone?: boolean;
    childIds?: string[];
    childAgeAtEntry?: Record<string, string>;
  }) => {
    if (!user) throw new Error('User not authenticated');
    try {
      await journalService.updateJournalEntry(entryId, updates);
      
      // Optimistically update local state without full reload
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryId 
            ? { ...entry, ...updates, updatedAt: new Date() }
            : entry
        )
      );
    } catch (e) {
      setError('Failed to update entry.');
      // Revert optimistic update on error
      throw e;
    }
  };

  // Function to delete an entry
  const deleteEntry = async (entryId: string, mediaUrls: string[]) => {
    if (!user) throw new Error('User not authenticated');
    setIsLoading(true);
    try {
      await journalService.deleteJournalEntry(entryId, mediaUrls);
      
      // Refresh local state
      const updatedEntries = await journalService.fetchUserJournalEntries(user.uid);
      setEntries(updatedEntries);
    } catch (e) {
      setError('Failed to delete entry.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle like on an entry
  const toggleLike = async (entryId: string) => {
    if (!user) throw new Error('User not authenticated');
    try {
      await journalService.toggleLike(entryId, user.uid);
      
      // Refresh local state
      const updatedEntries = await journalService.fetchUserJournalEntries(user.uid);
      setEntries(updatedEntries);
    } catch (e) {
      setError('Failed to toggle like.');
      throw e;
    }
  };

  const getEntryById = async (entryId: string) => {
    setIsLoading(true);
    try {
      const entry = await journalService.fetchJournalEntryById(entryId);
      return entry;
    } catch (e) {
      setError('Failed to fetch entry.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { entries, isLoading, error, addEntry, updateEntry, deleteEntry, toggleLike, getEntryById };
};
