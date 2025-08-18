import { db } from '@/lib/firebase/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export const recapInteractionService = {
  async toggleLike(recapId: string, userId: string): Promise<boolean> {
    const recapRef = doc(db, 'aiRecaps', recapId);
    const recapDoc = await getDoc(recapRef);
    
    if (!recapDoc.exists()) throw new Error('Recap not found');
    
    const data = recapDoc.data();
    const likes = data.likes || {};
    const isLiked = likes[userId] === true;
    
    // When liking, also set as favorite
    const updates: any = {
      [`likes.${userId}`]: isLiked ? null : true
    };
    
    if (!isLiked) {
      updates.isFavorited = true;
    }
    
    await updateDoc(recapRef, updates);
    
    return !isLiked;
  },

  async toggleFavorite(recapId: string, isFavorited: boolean): Promise<boolean> {
    const recapRef = doc(db, 'aiRecaps', recapId);
    
    await updateDoc(recapRef, {
      isFavorited: !isFavorited
    });
    
    return !isFavorited;
  },

  async toggleMilestone(recapId: string, isMilestone: boolean): Promise<boolean> {
    const recapRef = doc(db, 'aiRecaps', recapId);
    
    await updateDoc(recapRef, {
      isMilestone: !isMilestone
    });
    
    return !isMilestone;
  },

  async getLikesCount(recapId: string): Promise<number> {
    const recapRef = doc(db, 'aiRecaps', recapId);
    const recapDoc = await getDoc(recapRef);
    
    if (!recapDoc.exists()) return 0;
    
    const likes = recapDoc.data().likes || {};
    return Object.values(likes).filter(Boolean).length;
  },

  async isLikedByUser(recapId: string, userId: string): Promise<boolean> {
    const recapRef = doc(db, 'aiRecaps', recapId);
    const recapDoc = await getDoc(recapRef);
    
    if (!recapDoc.exists()) return false;
    
    const likes = recapDoc.data().likes || {};
    return likes[userId] === true;
  },

  async isFavoritedByUser(recapId: string, userId: string): Promise<boolean> {
    const recapRef = doc(db, 'aiRecaps', recapId);
    const recapDoc = await getDoc(recapRef);
    
    if (!recapDoc.exists()) return false;
    
    return recapDoc.data().isFavorited === true;
  }
};
