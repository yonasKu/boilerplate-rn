import { collection, doc, addDoc, getDocs, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

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
};
