import AsyncStorage from '@react-native-async-storage/async-storage';
import { Persistence } from 'firebase/auth';

// A custom persistence layer for Firebase Auth that uses AsyncStorage.
// This is necessary because the default persistence layers in the Firebase JS SDK
// may not work reliably in all React Native environments.

export const asyncStoragePersistence: Persistence = {
  type: 'LOCAL',
  // This function is called by Firebase to get a value from storage.
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  // This function is called by Firebase to set a value in storage.
  async setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  },
  // This function is called by Firebase to remove a value from storage.
  async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  },
} as unknown as Persistence;
