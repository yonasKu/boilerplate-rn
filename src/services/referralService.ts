import { collection, doc, addDoc, getDocs, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';

export interface Referral {
  id?: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: 'pending' | 'completed' | 'expired';
  rewardType?: string;
  rewardValue?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface CreateReferralData {
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
}

export const ReferralService = {
  referralsCollection: 'referrals',
  promoCodesCollection: 'promoCodes',

  createReferral: async (data: CreateReferralData): Promise<string> => {
    try {
      const referralData = {
        referrerUserId: data.referrerUserId,
        referredUserId: data.referredUserId,
        referralCode: data.referralCode,
        status: 'pending' as const,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'referrals'), referralData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw new Error('Failed to create referral');
    }
  },

  getReferrals: async (userId: string): Promise<Referral[]> => {
    try {
      const q = query(
        collection(db, 'referrals'),
        where('referrerUserId', '==', userId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      } as Referral));
    } catch (error) {
      console.error('Error getting referrals:', error);
      throw new Error('Failed to get referrals');
    }
  },

  completeReferral: async (referralId: string, rewardType?: string, rewardValue?: number): Promise<void> => {
    try {
      await updateDoc(doc(db, 'referrals', referralId), {
        status: 'completed',
        rewardType,
        rewardValue,
        completedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error completing referral:', error);
      throw new Error('Failed to complete referral');
    }
  },

  getPromoCodes: async (): Promise<PromoCode[]> => {
    try {
      const q = query(
        collection(db, 'promoCodes'),
        where('isActive', '==', true),
        where('validUntil', '>', Timestamp.now())
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom.toDate(),
        validUntil: doc.data().validUntil.toDate(),
      } as PromoCode));
    } catch (error) {
      console.error('Error getting promo codes:', error);
      throw new Error('Failed to get promo codes');
    }
  },

  validateReferralCode: async (code: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'referrals'),
        where('referralCode', '==', code),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  },

  /**
   * Returns the first pending referral document ID matching the given code, or undefined
   */
  getPendingReferralIdByCode: async (code: string): Promise<string | undefined> => {
    try {
      const q = query(
        collection(db, 'referrals'),
        where('referralCode', '==', code),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return undefined;
      return snapshot.docs[0].id;
    } catch (error) {
      console.error('Error querying referral by code:', error);
      return undefined;
    }
  },

  // --- Callable wrappers ---
  /**
   * Calls backend HTTP `generateReferralCode` to get or create the user's referral code (idempotent).
   */
  generateReferralCode: async (): Promise<string> => {
    const token = await getIdTokenOrAnon();
    const url = buildFunctionUrl('generateReferralCode');
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    if (!resp.ok) {
      const err = await safeJson(resp);
      throw new Error(err?.error || 'Failed to generate referral code');
    }
    const data = await resp.json();
    const code = data?.referralCode as string | undefined;
    if (!code) throw new Error('Failed to generate referral code');
    return code;
  },

  /**
   * Calls backend HTTP `processReferral` to apply referral benefits at signup/first-run.
   */
  processReferral: async (code: string): Promise<any> => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) throw new Error('Referral code is required');
    const token = await getIdTokenOrAnon();
    const url = buildFunctionUrl('processReferral');
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ referralCode: trimmed }),
    });
    if (!resp.ok) {
      const err = await safeJson(resp);
      throw new Error(err?.error || 'Failed to process referral');
    }
    return await resp.json();
  },

  /**
   * Calls backend HTTP `getReferralStats` for UI (code, totals, recent referrals).
   */
  getReferralStats: async (): Promise<any> => {
    const token = await getIdTokenOrAnon();
    const url = buildFunctionUrl('getReferralStats');
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    if (!resp.ok) {
      const err = await safeJson(resp);
      throw new Error(err?.error || 'Failed to fetch referral stats');
    }
    return await resp.json();
  },

  /**
   * Calls backend HTTP `redeemPromoCode` for promo or gift codes.
   */
  redeemPromoCode: async (code: string): Promise<any> => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) throw new Error('Code is required');
    const token = await getIdTokenOrAnon();
    const url = buildFunctionUrl('redeemPromoCode');
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ code: trimmed }),
    });
    if (!resp.ok) {
      const err = await safeJson(resp);
      throw new Error(err?.error || 'Failed to redeem code');
    }
    return await resp.json();
  },
};

// --- Helpers ---
const buildFunctionUrl = (name: string) => {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  return `https://us-central1-${projectId}.cloudfunctions.net/${name}`;
};

const getIdTokenOrAnon = async (): Promise<string> => {
  try {
    const user = auth.currentUser || (await signInAnonymously(auth)).user;
    return await user.getIdToken();
  } catch (e) {
    // Fallback: try anonymous sign-in again explicitly
    const cred = await signInAnonymously(auth);
    return await cred.user.getIdToken();
  }
};

const safeJson = async (resp: any) => {
  try { return await resp.json(); } catch { return undefined; }
};
