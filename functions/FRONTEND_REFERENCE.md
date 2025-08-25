```typescript
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase/firebaseConfig';
import { User } from 'firebase/auth';


// Fix for crypto.getRandomValues() not supported - use timestamp-based ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};


export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  subscription: {
    plan: string;
    status: string;
    startDate: Date;
    trialEndDate?: Date;
  };
  lifestage: string | null;
  children: Array<{
    name: string;
    age?: number;
    gender?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}


export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  dueDate?: string;
  birthDate?: string;
  gender: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface OnboardingStatus {
  hasProfile: boolean;
  hasChild: boolean;
  isComplete: boolean;
}


/**
 * Check if user has completed their profile setup
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Convert Firebase timestamps to proper Date objects
      return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        subscription: {
          ...data.subscription,
          startDate: data.subscription?.startDate?.toDate ? data.subscription.startDate.toDate() : new Date(data.subscription?.startDate || Date.now()),
          trialEndDate: data.subscription?.trialEndDate?.toDate ? data.subscription.trialEndDate.toDate() : (data.subscription?.trialEndDate ? new Date(data.subscription.trialEndDate) : undefined)
        }
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};


/**
 * Check if user has any child profiles
 */
export const getUserChildren = async (uid: string): Promise<ChildProfile[]> => {
  try {
    const childrenQuery = query(
      collection(db, 'children'),
      where('parentId', '==', uid)
    );
    const childrenSnapshot = await getDocs(childrenQuery);
    return childrenSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChildProfile));
  } catch (error) {
    console.error('Error fetching user children:', error);
    return [];
  }
};


/**
 * Check user's onboarding status
 */
export const checkOnboardingStatus = async (uid: string): Promise<OnboardingStatus> => {
  try {
    const [profile, children] = await Promise.all([
      getUserProfile(uid),
      getUserChildren(uid)
    ]);


    const hasProfile = profile !== null && profile.lifestage !== null;
    const hasChild = children.length > 0;
    const isComplete = hasProfile && hasChild;


    console.log('Onboarding Status Check:', {
      uid,
      hasProfile,
      hasChild,
      isComplete
    });


    return {
      hasProfile,
      hasChild,
      isComplete
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return {
      hasProfile: false,
      hasChild: false,
      isComplete: false
    };
  }
};


/**
 * Save user profile to Firestore
 */
export const saveUserProfile = async (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const now = new Date();
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      updatedAt: now,
    }, { merge: true });
    console.log('User profile saved successfully');
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};


/**
 * Updates a user's profile with their name and lifestage.
 */
export const updateUserProfile = async (uid: string, data: { name: string; lifestage: string }): Promise<void> => {
  try {
    const now = new Date();
    await setDoc(doc(db, 'users', uid), {
      name: data.name,
      lifestage: data.lifestage,
      updatedAt: now,
    }, { merge: true });
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};


/**
 * Save child profile to Firestore
 */
export const saveChildProfile = async (child: Omit<ChildProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date();
    const childData = {
      ...child,
      createdAt: now,
      updatedAt: now
    };
    
    const childRef = doc(collection(db, 'children'));
    await setDoc(childRef, childData);
    console.log('Child profile saved successfully');
    return childRef.id;
  } catch (error) {
    console.error('Error saving child profile:', error);
    throw error;
  }
};


/**
 * Upload user profile image to Firebase Storage
 */
export const uploadUserProfileImage = async (userId: string, imageUri: string): Promise<string> => {
  try {
    // Verify authentication state
    if (!userId) {
      throw new Error('User ID is required for upload');
    }
    
    // Check Firebase Auth state
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    console.log('Current user:', auth.currentUser?.uid);
    console.log('Requested userId:', userId);
    console.log('Auth match:', auth.currentUser?.uid === userId);
    
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to upload images');
    }
    
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `profile_images/${userId}/${generateId()}`);
    
    console.log('Uploading to:', imageRef.fullPath);
    console.log('Auth token available:', !!auth.currentUser);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    
    // Update user document with profile image URL
    await setDoc(doc(db, 'users', userId), {
      profileImageUrl: downloadURL,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('Profile image updated successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading user profile image:', error);
    throw error;
  }
};


/**
 * Upload child profile image to Firebase Storage
 */
export const uploadChildProfileImage = async (childId: string, imageUri: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `child_images/${childId}/${generateId()}`);
    
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);
    
    // Update child document with profile image URL
    await setDoc(doc(db, 'children', childId), {
      profileImageUrl: downloadURL,
      updatedAt: new Date()
    }, { merge: true });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading child profile image:', error);
    throw error;
  }
};


/**
 * Delete user profile image
 */
export const deleteUserProfileImage = async (userId: string, imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = urlParts[urlParts.length - 2];
    
    const imageRef = ref(storage, `profile_images/${userId}/${fileName}`);
    await deleteObject(imageRef);
    
    // Remove profile image URL from user document
    await setDoc(doc(db, 'users', userId), {
      profileImageUrl: null,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error deleting user profile image:', error);
    throw error;
  }
};


/**
 * Delete child profile image
 */
export const deleteChildProfileImage = async (childId: string, imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    const imageRef = ref(storage, `child_images/${childId}/${fileName}`);
    await deleteObject(imageRef);
    
    // Remove profile image URL from child document
    await setDoc(doc(db, 'children', childId), {
      profileImageUrl: null,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error deleting child profile image:', error);
    throw error;
  }
};

// -------------------------------------------------------------------
// SECOND FILE CONTENT
// -------------------------------------------------------------------

import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';


export interface Child {
  id?: string;
  parentId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface ChildInput {
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  avatar?: string;
  profileImageUrl?: string;
}


export const addChild = async (child: ChildInput, parentId: string): Promise<string> => {
  try {
    const now = new Date();
    const childData = {
      ...child,
      parentId,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, 'children'), childData);
    
    // Update user's children array
    await updateUserChildrenArray(parentId, docRef.id);
    
    console.log('Child added successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding child:', error);
    throw error;
  }
};


export const getUserChildren = async (parentId: string): Promise<Child[]> => {
  try {
    const q = query(collection(db, 'children'), where('parentId', '==', parentId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Child;
    });
  } catch (error) {
    console.error('Error fetching user children:', error);
    throw error;
  }
};


export const getChild = async (childId: string): Promise<Child | null> => {
  try {
    const childRef = doc(db, 'children', childId);
    const childSnap = await getDoc(childRef);


    if (childSnap.exists()) {
      const data = childSnap.data();
      return {
        id: childSnap.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Child;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error('Error fetching child by ID:', error);
    throw error;
  }
};


export const updateChild = async (childId: string, dataToUpdate: Partial<ChildInput>): Promise<void> => {
  try {
    const childRef = doc(db, 'children', childId);
    await updateDoc(childRef, {
      ...dataToUpdate,
      updatedAt: new Date()
    });
    console.log('Child updated successfully');
  } catch (error) {
    console.error('Error updating child:', error);
    throw error;
  }
};


export const updateUserChildrenArray = async (userId: string, childId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      children: arrayUnion(childId),
      updatedAt: new Date(),
      onboarded: true
    });
    console.log('User children array updated successfully');
  } catch (error) {
    console.error('Error updating user children array:', error);
    throw error;
  }
};


export const deleteChild = async (childId: string): Promise<void> => {
  try {
    // Note: This would require additional logic to remove from user's children array
    // For now, just log the deletion
    console.log('Child deletion not implemented yet');
  } catch (error) {
    console.error('Error deleting child:', error);
    throw error;
  }
};
```

---

# Journal Service APIs

## Media Upload & Management

### `uploadMedia(uri: string, type: 'image' | 'video'): Promise<string>`
Uploads media files to Firebase Storage and returns the download URL.

**Parameters:**
- `uri`: Local file URI to upload
- `type`: 'image' or 'video' type indicator

**Returns:** Firebase Storage download URL

## Journal Entry CRUD Operations

### `createJournalEntry(entryData: object): Promise<string>`
Creates a new journal entry in Firestore.

**Entry Data Structure:**
```typescript
{
  userId: string;
  childIds: string[]; // Multi-child support
  text: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
  }>;
  isFavorited: boolean;
  isMilestone: boolean;
  childAgeAtEntry: Record<string, string>;
  likes?: Record<string, boolean>;
}
```

### `fetchJournalEntryById(entryId: string): Promise<JournalEntry | null>`
Retrieves a single journal entry by ID.

### `fetchUserJournalEntries(userId: string): Promise<JournalEntry[]>`
Fetches all journal entries for a specific user, ordered by creation date (newest first).

### `updateJournalEntry(entryId: string, updates: object): Promise<void>`
Updates an existing journal entry.

**Updateable fields:**
- `text?: string`
- `media?: Array<{type: 'image' | 'video', url: string, thumbnailUrl?: string}>`
- `isFavorited?: boolean`
- `isMilestone?: boolean`

### `deleteJournalEntry(entryId: string, mediaUrls: string[]): Promise<void>`
Deletes a journal entry and its associated media files from storage.

## Social Features

### `toggleLike(entryId: string, userId: string): Promise<void>`
Toggles a like on a journal entry using Firestore transactions for consistency.

## Utility Functions

### `calculateChildAgeAtDate(birthDate: Date, entryDate: Date): string`
Calculates a child's age at the time of a journal entry.

**Returns:** Human-readable age string (e.g., "2 years, 3 months, 5 days")

## JournalEntry Interface

```typescript
interface JournalEntry {
  id: string;
  userId: string;
  childIds: string[];
  text: string;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
  }>;
  isFavorited: boolean;
  isMilestone: boolean;
  childAgeAtEntry: Record<string, string>;
  likes: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}
```
