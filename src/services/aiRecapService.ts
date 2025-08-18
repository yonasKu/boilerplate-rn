import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

export interface Recap {
  id?: string;
  userId: string;
  childId: string;
  type: 'weekly' | 'monthly' | 'yearly';
  period: {
    startDate: Date;
    endDate: Date;
  };
  aiGenerated: {
    title?: string;
    summary?: string;
    keyMoments?: string[];
    recapText?: string;
    tone?: string;
  };
  media?: {
    highlightPhotos: string[];
  };
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  generatedAt: Date;
}

export interface CreateRecapData {
  userId: string;
  childId: string;
  type: 'weekly' | 'monthly' | 'yearly';
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export const RecapService = {
  collectionName: 'recaps',

  createRecap: async (data: CreateRecapData): Promise<string> => {
    try {
      const recapData = {
        userId: data.userId,
        childId: data.childId,
        type: data.type,
        period: data.period,
        aiGenerated: {
          title: '',
          summary: '',
          keyMoments: [],
        },
        media: {
          highlightPhotos: [],
        },
        status: 'generating' as const,
        createdAt: Timestamp.now(),
        generatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, RecapService.collectionName), recapData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating recap:', error);
      throw new Error('Failed to create recap');
    }
  },

  getRecaps: async (userId: string): Promise<Recap[]> => {
    try {
      const q = query(
        collection(db, RecapService.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        generatedAt: doc.data().generatedAt.toDate(),
      } as Recap));
    } catch (error) {
      console.error('Error getting recaps:', error);
      throw new Error('Failed to get recaps');
    }
  },

  updateRecap: async (
    recapId: string,
    updates: {
      aiGenerated?: { title: string; summary: string; keyMoments: string[] };
      media?: { highlightPhotos: string[] };
      status?: 'generating' | 'completed' | 'failed';
    }
  ): Promise<void> => {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, RecapService.collectionName, recapId), updateData);
    } catch (error) {
      console.error('Error updating recap:', error);
      throw new Error('Failed to update recap');
    }
  },

  deleteRecap: async (recapId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, RecapService.collectionName, recapId));
    } catch (error) {
      console.error('Error deleting recap:', error);
      throw new Error('Failed to delete recap');
    }
  },

  getRecapsByChild: async (userId: string, childId: string): Promise<Recap[]> => {
    try {
      const q = query(
        collection(db, RecapService.collectionName),
        where('userId', '==', userId),
        where('childId', '==', childId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        generatedAt: doc.data().generatedAt.toDate(),
      } as Recap));
    } catch (error) {
      console.error('Error getting recaps by child:', error);
      throw new Error('Failed to get recaps by child');
    }
  },

  tagRecap: async (recapId: string, tags: { isFavorited?: boolean; isMilestone?: boolean }): Promise<void> => {
    try {
      const updateData: any = {
        ...tags,
        updatedAt: Timestamp.now(),
      };

      // Remove undefined keys so we only update the fields that are passed
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await updateDoc(doc(db, RecapService.collectionName, recapId), updateData);
    } catch (error) {
      console.error('Error tagging AI recap:', error);
      throw new Error('Failed to tag AI recap');
    }
  },

  getRecapsByType: async (userId: string, type: 'weekly' | 'monthly' | 'yearly'): Promise<Recap[]> => {
    try {
      const q = query(
        collection(db, RecapService.collectionName),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        generatedAt: doc.data().generatedAt.toDate(),
      } as Recap));
    } catch (error) {
      console.error('Error getting recaps by type:', error);
      throw new Error('Failed to get recaps by type');
    }
  },
};
