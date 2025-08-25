# Recap Interactions Implementation Guide

## Overview
This guide outlines the implementation of journal-like interactions (likes, favorites, comments) for AI recaps in SproutBook.

## Current Status
✅ **RecapViewScreen.tsx** already includes:
- Comment modal/sheet structure (lines 171-186)
- CommentsSection component integration
- Basic footer buttons for comments and sharing
- ShareBottomSheet integration

## Implementation Plan

### 1. Data Model Updates
Add to recap documents:
```typescript
interface Recap {
  // Existing fields...
  likes: Record<string, boolean>; // userId -> true
  isFavorited: boolean;
  isMilestone: boolean;
  commentCount: number;
  lastCommentAt?: Timestamp;
}
```

### 2. Service Files to Create

#### Recap Interaction Service
**Location:** `src/features/recaps/services/recapInteractionService.ts`
```typescript
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
    
    await updateDoc(recapRef, {
      [`likes.${userId}`]: isLiked ? null : true
    });
    
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
    
    return recapDoc.data().isFavorited;
  }
};
```

#### Recap Comments Service  
**Location:** `src/features/recaps/services/recapCommentsService.ts`
```typescript
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, doc, addDoc, getDocs, deleteDoc, query, where, orderBy, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

export interface RecapComment {
  id: string;
  recapId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
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
    
    // Update comment count in recap
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
    const q = query(
      collection(db, 'recapComments'),
      where('recapId', '==', recapId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as RecapComment));
  },

  async deleteComment(commentId: string, recapId: string): Promise<void> {
    await deleteDoc(doc(db, 'recapComments', commentId));
    
    // Update comment count in recap
    await updateDoc(doc(db, 'aiRecaps', recapId), {
      commentCount: increment(-1)
    });
  },

  async getCommentCount(recapId: string): Promise<number> {
    const q = query(
      collection(db, 'recapComments'),
      where('recapId', '==', recapId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }
};
```

### 3. Firestore Collections

#### Recaps Collection Updates
```
aiRecaps/{recapId}/
  - likes: {userId1: true, userId2: true}
  - isFavorited: boolean
  - isMilestone: boolean
  - commentCount: number
  - lastCommentAt: Timestamp
```

#### Recap Comments Collection
```
recapComments/{commentId}/
  - recapId: string
  - userId: string
  - text: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

### 4. UI Components to Update

#### RecapViewScreen.tsx (Current)
- [ ] Add like/favorite toggle buttons in footer
- [ ] Connect comment count to actual data
- [ ] Add loading states for interactions
- [ ] Add milestone toggle button

#### JournalScreen.tsx Updates
- [ ] Add milestone selection from journal entries
- [ ] Allow users to mark journal entries as milestones
- [ ] Sync milestone status with corresponding recaps

#### New Components Needed
- [ ] `RecapActionButtons.tsx` - Like/favorite/milestone buttons component
- [ ] `RecapCommentsSection.tsx` - Comments display component
- [ ] `RecapCommentInput.tsx` - Comment input component
- [ ] `MilestoneToggle.tsx` - Reusable milestone toggle component

### 5. Hook Updates
Update `useRecap.ts` to include interaction data:
```typescript
const useRecap = (recapId: string) => {
  // Add likes, favorites, commentCount to return
  return { recap, likes, isFavorited, isMilestone, commentCount, loading, error };
};
```

### 6. Implementation Steps

1. **Create Services** (Priority: High)
   - Create recapInteractionService.ts
   - Create recapCommentsService.ts
   - Add proper TypeScript types

2. **Update Data Models** (Priority: High)
   - Add likes/favorites fields to recap documents
   - Create recapComments collection
   - Update existing recaps with new fields

3. **Update UI** (Priority: Medium)
   - Add interaction buttons to RecapViewScreen
   - Connect comment count to actual data
   - Add loading states for interactions

4. **Testing** (Priority: Medium)
   - Test like/unlike functionality
   - Test favorite/unfavorite functionality
   - Test milestone toggle functionality
   - Test comment creation/deletion
   - Test real-time updates

### 7. Code Examples

#### Adding Interaction Buttons
```typescript
// In RecapViewScreen.tsx footer
<TouchableOpacity onPress={() => handleLikePress()}>
  <Ionicons name={isLiked ? "heart" : "heart-outline"} />
</TouchableOpacity>

<TouchableOpacity onPress={() => handleFavoritePress()}>
  <Ionicons name={isFavorited ? "star" : "star-outline"} />
</TouchableOpacity>

<TouchableOpacity onPress={() => handleMilestonePress()}>
  <Ionicons name={isMilestone ? "trophy" : "trophy-outline"} />
</TouchableOpacity>
```

#### Adding Favorite Button
```typescript
<TouchableOpacity 
  style={styles.footerButton}
  onPress={() => handleFavoritePress()}
>
  <Ionicons 
    name={isFavorited ? "star" : "star-outline"} 
    size={24} 
    color={isFavorited ? Colors.yellow : Colors.grey} 
  />
</TouchableOpacity>
```

### 8. Dependencies
- Existing: Firebase Firestore, React Native, Expo Router
- No new dependencies required

### 9. Security Rules
Update Firestore rules for:
- Recap likes/favorites (authenticated users only)
- Recap comments (create/read for authenticated users)
- Comment deletion (only by comment author)

### 10. Migration Strategy
- Backfill existing recaps with empty likes/favorites objects
- Set commentCount to 0 for existing recaps
- No breaking changes to existing recap structure

## Files to Create/Update

### New Files:
- `src/features/recaps/services/recapInteractionService.ts`
- `src/features/recaps/services/recapCommentsService.ts`
- `src/features/recaps/components/RecapActionButtons.tsx`
- `src/features/recaps/components/RecapCommentsSection.tsx`

### Updated Files:
- `src/features/recaps/screens/RecapViewScreen.tsx` (add interaction buttons)
- `src/features/recaps/hooks/useRecap.ts` (add interaction data)
- `firestore.rules` (add security rules)

## Testing Checklist
- [ ] Like/unlike updates in real-time
- [ ] Favorite/unfavorite persists correctly
- [ ] Comment count updates when comments added/deleted
- [ ] User can only like/favorite once per recap
- [ ] Comments display in chronological order
- [ ] Comment input sheet works correctly
- [ ] Share functionality remains intact
