import { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
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
  summary?: {
    media?: {
      highlightPhotos?: string[];
    };
  };
  status: 'generating' | 'completed' | 'failed';
  createdAt?: Date;
  generatedAt?: Date;
  isFavorited?: boolean;
  isMilestone?: boolean;
  likes?: Record<string, boolean>;
  commentCount?: number;
}


export const RecapService = {
  collectionName: 'recaps',

  /**
   * Get all recaps for a user
   */
  getRecaps: async (userId: string): Promise<Recap[]> => {
    try {
      const q = query(
        collection(db, RecapService.collectionName),
        where('userId', '==', userId),
        orderBy('period.endDate', 'desc')
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          media: {
            highlightPhotos: data.media?.highlightPhotos || data.summary?.media?.highlightPhotos || []
          },
          period: {
            startDate: data.period.startDate.toDate(),
            endDate: data.period.endDate.toDate(),
          },
          createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
          generatedAt: data.generatedAt ? data.generatedAt.toDate() : undefined,
        } as Recap;
      });
    } catch (error) {
      console.error('🔥🔥🔥 Firestore query failed:', error);
      throw new Error('Failed to get recaps');
    }
  },

  /**
   * Get recaps for specific children
   */
  getRecapsByChild: async (userId: string, childId: string): Promise<Recap[]> => {
    try {
      const q = query(
        collection(db, RecapService.collectionName),
        where('userId', '==', userId),
        where('childId', '==', childId),
        orderBy('period.endDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          media: {
            highlightPhotos: data.media?.highlightPhotos || data.summary?.media?.highlightPhotos || []
          },
          period: {
            startDate: data.period.startDate.toDate(),
            endDate: data.period.endDate.toDate(),
          },
          createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
          generatedAt: data.generatedAt ? data.generatedAt.toDate() : undefined,
        } as Recap;
      });
    } catch (error) {
      console.error('Error getting recaps by child:', error);
      throw new Error('Failed to get recaps by child');
    }
  },

  /**
   * Get recaps by type
   */
  getRecapsByType: async (userId: string, type: 'weekly' | 'monthly' | 'yearly', childId?: string): Promise<Recap[]> => {
    try {
      let q = query(
        collection(db, RecapService.collectionName),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('period.endDate', 'desc')
      );

      if (childId) {
        q = query(q, where('childId', '==', childId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          media: {
            highlightPhotos: data.media?.highlightPhotos || data.summary?.media?.highlightPhotos || []
          },
          period: {
            startDate: data.period.startDate.toDate(),
            endDate: data.period.endDate.toDate(),
          },
          createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
          generatedAt: data.generatedAt ? data.generatedAt.toDate() : undefined,
        } as Recap;
      });
    } catch (error) {
      console.error('Error getting recaps by type:', error);
      throw new Error('Failed to get recaps by type');
    }
  },

  /**
   * Update recap with AI generated content
   */
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

  /**
   * Tag recap with interactions
   */
  tagRecap: async (
    recapId: string,
    tags: { isFavorited?: boolean; isMilestone?: boolean }
  ): Promise<void> => {
    try {
      const updateData: any = {
        ...tags,
        updatedAt: Timestamp.now(),
      };

      // Remove undefined keys so we only update the fields that are passed
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await updateDoc(doc(db, RecapService.collectionName, recapId), updateData);
    } catch (error) {
      console.error('Error tagging recap:', error);
      throw new Error('Failed to tag recap');
    }
  },

  /**
   * Toggle like on a recap
   */
  toggleLike: async (recapId: string, userId: string): Promise<boolean> => {
    try {
      const recapRef = doc(db, RecapService.collectionName, recapId);
      const recapDoc = await getDoc(recapRef);
      
      if (!recapDoc.exists()) throw new Error('Recap not found');
      
      const data = recapDoc.data();
      const likes = data.likes || {};
      const isLiked = likes[userId] === true;
      
      const updates: any = {
        [`likes.${userId}`]: isLiked ? null : true
      };
      
      if (!isLiked) {
        updates.isFavorited = true;
      }
      
      await updateDoc(recapRef, updates);
      
      return !isLiked;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw new Error('Failed to toggle like');
    }
  },

  /**
   * Get likes count for a recap
   */
  getLikesCount: async (recapId: string): Promise<number> => {
    try {
      const recapRef = doc(db, RecapService.collectionName, recapId);
      const recapDoc = await getDoc(recapRef);
      
      if (!recapDoc.exists()) return 0;
      
      const likes = recapDoc.data().likes || {};
      return Object.values(likes).filter(Boolean).length;
    } catch (error) {
      console.error('Error getting likes count:', error);
      throw new Error('Failed to get likes count');
    }
  },

  /**
   * Check if recap is liked by user
   */
  isLikedByUser: async (recapId: string, userId: string): Promise<boolean> => {
    try {
      const recapRef = doc(db, RecapService.collectionName, recapId);
      const recapDoc = await getDoc(recapRef);
      
      if (!recapDoc.exists()) return false;
      
      const likes = recapDoc.data().likes || {};
      return likes[userId] === true;
    } catch (error) {
      console.error('Error checking if liked by user:', error);
      throw new Error('Failed to check like status');
    }
  },

  /**
   * Delete a recap
   */
  deleteRecap: async (recapId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, RecapService.collectionName, recapId));
    } catch (error) {
      console.error('Error deleting recap:', error);
      throw new Error('Failed to delete recap');
    }
  },

};
