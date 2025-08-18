import { db } from '@/lib/firebase/firebaseConfig';
import { collection, doc, addDoc, getDocs, deleteDoc, query, where, orderBy, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

export interface RecapComment {
  id?: string;
  recapId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export const recapCommentsService = {
  async addComment(recapId: string, userId: string, userName: string, text: string, userAvatar?: string): Promise<RecapComment> {
    const commentData = {
      recapId,
      userId,
      userName,
      userAvatar: userAvatar || null,
      text: text.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const commentRef = await addDoc(collection(db, 'recapComments'), commentData);
    
    // Update recap comment count
    await updateDoc(doc(db, 'aiRecaps', recapId), {
      commentCount: increment(1),
      lastCommentAt: serverTimestamp()
    });
    
    return {
      id: commentRef.id,
      recapId,
      userId,
      userName,
      userAvatar,
      text: text.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  async getComments(recapId: string): Promise<RecapComment[]> {
    const commentsQuery = query(
      collection(db, 'recapComments'),
      where('recapId', '==', recapId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as RecapComment));
  },

  async deleteComment(commentId: string, recapId: string): Promise<void> {
    await deleteDoc(doc(db, 'recapComments', commentId));
    
    // Update recap comment count
    await updateDoc(doc(db, 'aiRecaps', recapId), {
      commentCount: increment(-1)
    });
  },

  async getCommentsCount(recapId: string): Promise<number> {
    const commentsQuery = query(
      collection(db, 'recapComments'),
      where('recapId', '==', recapId)
    );
    
    const querySnapshot = await getDocs(commentsQuery);
    return querySnapshot.size;
  }
};
