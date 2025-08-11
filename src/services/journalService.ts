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
  getDoc, // Add getDoc
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
// 3. Fetches a single journal entry by its ID
export const fetchJournalEntryById = async (entryId: string): Promise<JournalEntry | null> => {
  const entryRef = doc(db, 'journalEntries', entryId);
  const docSnap = await getDoc(entryRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as JournalEntry;
  } else {
    console.warn(`No journal entry found with ID: ${entryId}`);
    return null;
  }
};

// 4. Fetches all journal entries for a specific user
export const fetchUserJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const q = query(
    collection(db, 'journalEntries'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
};

// 5. Updates an existing journal entry
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

// 6. Deletes a journal entry and its associated media
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

// 7. Toggles like on a journal entry using transaction
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
    
    // Update isFavorited based on whether current user has liked the entry
    const isFavorited = !!likes[userId];
    
    transaction.update(entryRef, { 
      likes,
      isFavorited 
    });
  });
};

// 8. Calculates child's age at a specific date
export const calculateChildAgeAtDate = (birthDate: Date, entryDate: Date): string => {
  const birth = new Date(birthDate);
  const entry = new Date(entryDate);

  let years = entry.getFullYear() - birth.getFullYear();
  let months = entry.getMonth() - birth.getMonth();
  let days = entry.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(entry.getFullYear(), entry.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) {
    parts.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months > 1 ? 's' : ''}`);
  }
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'Today';
  }

  return parts.join(', ');
};
