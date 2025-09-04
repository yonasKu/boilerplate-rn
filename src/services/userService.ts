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
  // Journal-level settings
  journalName?: string;
  journalImageUrl?: string;
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
 * Upload a journal image for the user's journal and persist the URL to users/{uid}.journalImageUrl
 */
export const uploadJournalImage = async (userId: string, imageUri: string): Promise<string> => {
  try {
    if (!userId) throw new Error('User ID is required');

    const response = await fetch(imageUri);
    const blob = await response.blob();
    const imageRef = ref(storage, `journal_images/${userId}/${generateId()}`);
    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);

    await setDoc(doc(db, 'users', userId), {
      journalImageUrl: downloadURL,
      updatedAt: new Date()
    }, { merge: true });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading journal image:', error);
    throw error;
  }
};

/**
 * Update journal settings on the user document. Pass any subset of fields.
 */
export const updateJournalSettings = async (
  userId: string,
  data: { journalName?: string; journalImageUrl?: string }
): Promise<void> => {
  try {
    if (!userId) throw new Error('User ID is required');
    if (!data || Object.keys(data).length === 0) return;

    await setDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating journal settings:', error);
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

/**
 * Ensure the users/{uid} document exists with the required fields for Firestore rules.
 * Returns true if the document was created, false if it already existed or couldn't be created.
 */
export const ensureUserDocumentExists = async (
  uid: string,
  name?: string | null,
  email?: string | null
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return false; // already exists
    }

    // Firestore rules require a valid email on create that matches the auth token
    if (!email) {
      console.warn('ensureUserDocumentExists: missing email; cannot create user doc due to Firestore rules', { uid });
      return false;
    }

    const now = new Date();
    const safeName = (name && name.trim().length > 0) ? name.trim() : 'New User';

    await setDoc(userRef, {
      uid,
      name: safeName,
      email,
      lifestage: null,
      subscription: {
        plan: 'free',
        status: 'trial',
        startDate: now,
        trialEndDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
      },
      children: [],
      createdAt: now,
      updatedAt: now,
      onboarded: false
    });

    console.log('ensureUserDocumentExists: created users doc for', uid);
    return true;
  } catch (e) {
    console.error('ensureUserDocumentExists error:', e);
    return false;
  }
};
