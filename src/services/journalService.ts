// src/services/journalService.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/firebaseConfig';
import { JournalEntry } from '@/hooks/useJournal';

// Fix for crypto.getRandomValues() not supported
// Use a simple timestamp-based ID instead of uuid
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 1. Uploads media (image/video) to Firebase Storage
export const uploadMedia = async (uri: string, type: 'image' | 'video'): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mediaRef = ref(storage, `journal_media/${generateId()}`);
  
  await uploadBytes(mediaRef, blob);
  return getDownloadURL(mediaRef);
};

// 2. Saves a new journal entry to Firestore
export const createJournalEntry = async (entryData: {
  userId: string;
  childId: string;
  text: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
  }>;
  isFavorited: boolean;
  isMilestone: boolean;
  childAgeAtEntry: string;
  likes?: Record<string, boolean>;
}) => {
  try {
    console.log('Creating journal entry with data:', {
      userId: entryData.userId,
      childId: entryData.childId,
      textLength: entryData.text.length,
      mediaCount: entryData.media.length,
      isFavorited: entryData.isFavorited,
      isMilestone: entryData.isMilestone,
      childAgeAtEntry: entryData.childAgeAtEntry
    });
    
    const docRef = await addDoc(collection(db, 'journalEntries'), {
      ...entryData,
      likes: entryData.likes || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Journal entry created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    console.error('Entry data that failed:', {
      userId: entryData.userId,
      childId: entryData.childId,
      textLength: entryData.text.length,
      mediaCount: entryData.media.length,
      hasMedia: entryData.media.length > 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

// 3. Fetches all journal entries for a specific user
export const fetchUserJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const q = query(
    collection(db, 'journalEntries'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
};

// 4. Updates an existing journal entry
export const updateJournalEntry = async (entryId: string, updates: {
  text?: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
  }>;
  isFavorited?: boolean;
  isMilestone?: boolean;
}) => {
  const entryRef = doc(db, 'journalEntries', entryId);
  await updateDoc(entryRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

// 5. Deletes a journal entry and its associated media
export const deleteJournalEntry = async (entryId: string, mediaUrls: string[]) => {
  // Delete associated media files from storage
  const deletePromises = mediaUrls.map(async (url) => {
    try {
      const mediaRef = ref(storage, url);
      await deleteObject(mediaRef);
    } catch (error) {
      console.warn('Failed to delete media:', error);
    }
  });
  
  await Promise.all(deletePromises);
  
  // Delete the Firestore document
  await deleteDoc(doc(db, 'journalEntries', entryId));
};

// 6. Toggles like on a journal entry using transaction
export const toggleLike = async (entryId: string, userId: string) => {
  const entryRef = doc(db, 'journalEntries', entryId);
  
  await runTransaction(db, async (transaction) => {
    const entryDoc = await transaction.get(entryRef);
    
    if (!entryDoc.exists()) {
      throw new Error('Entry not found');
    }
    
    const entryData = entryDoc.data();
    const likes = entryData.likes || {};
    
    if (likes[userId]) {
      // Unlike: remove user's like
      delete likes[userId];
    } else {
      // Like: add user's like
      likes[userId] = true;
    }
    
    transaction.update(entryRef, { likes });
  });
};

// 7. Calculates child's age at a specific date
export const calculateChildAgeAtDate = (birthDate: Date, entryDate: Date): string => {
  const diffTime = Math.abs(entryDate.getTime() - birthDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = Math.floor((diffDays % 365) % 30);
  
  let ageString = '';
  if (years > 0) ageString += `${years} year${years > 1 ? 's' : ''}`;
  if (months > 0) ageString += `${ageString ? ', ' : ''}${months} month${months > 1 ? 's' : ''}`;
  if (days > 0 || (!years && !months)) ageString += `${ageString ? ', ' : ''}${days} day${days > 1 ? 's' : ''}`;
  
  return ageString || '0 days';
};
