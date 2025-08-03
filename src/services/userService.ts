import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';
import { User } from 'firebase/auth';

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
  parentUid: string;
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
      where('parentUid', '==', uid)
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

export const updateUserLifestage = async (uid: string, lifestage: string): Promise<void> => {
  try {
    const now = new Date();
    await setDoc(doc(db, 'users', uid), {
      lifestage,
      updatedAt: now,
    }, { merge: true });
    console.log('User lifestage updated successfully');
  } catch (error) {
    console.error('Error updating user lifestage:', error);
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
