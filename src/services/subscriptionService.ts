import { collection, doc, getDoc, updateDoc, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

export interface AICredits {
  userId: string;
  credits: number;
  updatedAt: Date;
}

export interface FeatureFlags {
  userId: string;
  features: {
    aiRecaps: boolean;
    unlimitedEntries: boolean;
    familySharing: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
  };
  updatedAt: Date;
}

export const SubscriptionService = {
  aiCreditsCollection: 'aiCredits',
  featureFlagsCollection: 'featureFlags',

  getAICredits: async (userId: string): Promise<AICredits> => {
    try {
      const docRef = doc(db, 'aiCredits', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId,
          credits: data.credits,
          updatedAt: data.updatedAt.toDate(),
        };
      }

      // Create default credits for new users (demo mode - unlimited)
      const defaultCredits = {
        userId,
        credits: 9999, // Demo: unlimited credits
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        userId,
        credits: 9999,
        updatedAt: Timestamp.now(),
      });
      
      return defaultCredits;
    } catch (error) {
      console.error('Error getting AI credits:', error);
      // Return demo credits on error
      return {
        userId,
        credits: 9999,
        updatedAt: new Date(),
      };
    }
  },

  updateAICredits: async (userId: string, credits: number): Promise<void> => {
    try {
      const docRef = doc(db, 'aiCredits', userId);
      await setDoc(docRef, {
        credits,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating AI credits:', error);
      throw new Error('Failed to update AI credits');
    }
  },

  getFeatureFlags: async (userId: string): Promise<FeatureFlags> => {
    try {
      const docRef = doc(db, 'featureFlags', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId,
          features: data.features,
          updatedAt: data.updatedAt.toDate(),
        };
      }

      // Create default feature flags for new users (demo mode - all enabled)
      const defaultFlags = {
        userId,
        features: {
          aiRecaps: true,
          unlimitedEntries: true,
          familySharing: true,
          advancedAnalytics: true,
          exportData: true,
        },
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        userId,
        features: defaultFlags.features,
        updatedAt: Timestamp.now(),
      });
      
      return defaultFlags;
    } catch (error) {
      console.error('Error getting feature flags:', error);
      // Return demo flags on error
      return {
        userId,
        features: {
          aiRecaps: true,
          unlimitedEntries: true,
          familySharing: true,
          advancedAnalytics: true,
          exportData: true,
        },
        updatedAt: new Date(),
      };
    }
  },

  hasFeatureAccess: async (userId: string, feature: keyof FeatureFlags['features']): Promise<boolean> => {
    try {
      const flags = await SubscriptionService.getFeatureFlags(userId);
      return flags.features[feature];
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Demo mode: return true for all features
      return true;
    }
  },

  useAICredit: async (userId: string, amount: number = 1): Promise<boolean> => {
    try {
      const credits = await SubscriptionService.getAICredits(userId);
      if (credits.credits >= amount) {
        await SubscriptionService.updateAICredits(userId, credits.credits - amount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error using AI credit:', error);
      // Demo mode: always allow
      return true;
    }
  },
};
