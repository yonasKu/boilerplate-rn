import { doc, getDoc, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

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


export interface SubscriptionSnapshot {
  status: 'active' | 'trial' | 'inactive' | 'cancelled';
  plan?: string | null;
  productId?: string | null;
  platform?: string | null;
  willRenew?: boolean | null;
  expirationDate?: Date | null;
  originalPurchaseDate?: Date | null;
  isSandbox?: boolean;
  updatedAt?: Date | null;
}

export const SubscriptionService = {
  featureFlagsCollection: 'featureFlags',

  // Read normalized subscription status written by backend webhook
  getSubscriptionStatus: async (userId: string): Promise<SubscriptionSnapshot | null> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;

      const data: any = userSnap.data();
      const s = data.subscription || {};

      const toDate = (v: any): Date | null => {
        if (!v) return null;
        if (typeof v?.toDate === 'function') return v.toDate();
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      const snap: SubscriptionSnapshot = {
        status: (s.status as SubscriptionSnapshot['status']) || 'inactive',
        plan: s.plan ?? null,
        productId: s.productId ?? null,
        platform: s.platform ?? null,
        willRenew: typeof s.willRenew === 'boolean' ? s.willRenew : null,
        expirationDate: toDate(s.expirationDate),
        originalPurchaseDate: toDate(s.originalPurchaseDate),
        isSandbox: !!s.isSandbox,
        updatedAt: toDate(s.updatedAt),
      };

      return snap;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return null;
    }
  },

  // Convenience helper for gating
  hasActiveSubscription: async (userId: string): Promise<boolean> => {
    try {
      const sub = await SubscriptionService.getSubscriptionStatus(userId);
      if (!sub) return false;
      const now = new Date();
      const notExpired = !sub.expirationDate || sub.expirationDate > now;
      return (sub.status === 'active' || sub.status === 'trial') && notExpired;
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  },


  getFeatureFlags: async (userId: string): Promise<FeatureFlags> => {
    try {
      const docRef = doc(db, 'featureFlags', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data: any = docSnap.data();
        return {
          userId,
          features: data.features,
          updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
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
      return !!flags.features[feature];
    } catch (error) {
      console.error('Error checking feature access:', error);
      // Demo mode: return true for all features
      return true;
    }
  },
};
