import { db } from '@/lib/firebase/firebaseConfig';
import { collection, doc, addDoc, getDocs, getDoc, deleteDoc, query, where, orderBy, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

export interface RecapComment {
  id?: string;
  recapId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional image-specific context
  imageUrl?: string;
  imageThumbUrl?: string;
  imageIndex?: number;
  imageStoragePath?: string;
}

export const recapCommentsService = {
  async addComment(
    recapId: string,
    userId: string,
    userName: string,
    text: string,
    userAvatar?: string,
    options?: { imageUrl?: string; imageThumbUrl?: string; imageIndex?: number; imageStoragePath?: string }
  ): Promise<RecapComment> {
    console.log('Adding comment:', { recapId, userId, text });
    const commentData = {
      recapId,
      userId,
      userName,
      userAvatar: userAvatar || null,
      text: text.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(options?.imageUrl ? { imageUrl: options.imageUrl } : {}),
      ...(options?.imageThumbUrl ? { imageThumbUrl: options.imageThumbUrl } : {}),
      ...(typeof options?.imageIndex === 'number' ? { imageIndex: options.imageIndex } : {}),
      ...(options?.imageStoragePath ? { imageStoragePath: options.imageStoragePath } : {}),
    };
    
    const commentRef = await addDoc(collection(db, 'recapComments'), commentData);
    
    // Update recap comment count
    await updateDoc(doc(db, 'recaps', recapId), {
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
      updatedAt: new Date(),
      imageUrl: options?.imageUrl,
      imageThumbUrl: options?.imageThumbUrl,
      imageIndex: options?.imageIndex,
      imageStoragePath: options?.imageStoragePath,
    };
  },

  async getComments(
    recapId: string,
    filter?: { imageIndex?: number; imageUrl?: string; onlyRecapLevel?: boolean }
  ): Promise<RecapComment[]> {
    let commentsQuery;
    if (filter?.onlyRecapLevel) {
      // Comments without image context
      commentsQuery = query(
        collection(db, 'recapComments'),
        where('recapId', '==', recapId),
        where('imageIndex', '==', null as unknown as number),
        orderBy('createdAt', 'desc')
      );
    } else if (typeof filter?.imageIndex === 'number') {
      commentsQuery = query(
        collection(db, 'recapComments'),
        where('recapId', '==', recapId),
        where('imageIndex', '==', filter.imageIndex),
        orderBy('createdAt', 'desc')
      );
    } else if (filter?.imageUrl) {
      commentsQuery = query(
        collection(db, 'recapComments'),
        where('recapId', '==', recapId),
        where('imageUrl', '==', filter.imageUrl),
        orderBy('createdAt', 'desc')
      );
    } else {
      commentsQuery = query(
        collection(db, 'recapComments'),
        where('recapId', '==', recapId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(commentsQuery);
    
    const comments = querySnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });

    // Fetch user profiles for each comment
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', comment.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              ...comment,
              userName: userData.displayName || userData.name || 'Anonymous',
              userAvatar: userData.profileImageUrl || userData.photoURL || userData.avatar || null
            };
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
        return comment;
      })
    );

    return enrichedComments as RecapComment[];
  },

  async deleteComment(commentId: string, recapId: string): Promise<void> {
    await deleteDoc(doc(db, 'recapComments', commentId));
    
    // Update recap comment count
    await updateDoc(doc(db, 'recaps', recapId), {
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
