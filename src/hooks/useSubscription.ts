import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebaseConfig';

export type SubscriptionStatus = 'active' | 'trial' | 'inactive' | 'cancelled';

export type SubscriptionSnapshot = {
  status: SubscriptionStatus;
  plan?: string | null;
  productId?: string | null;
  platform?: string | null;
  willRenew?: boolean | null;
  expirationDate?: Date | null;
  originalPurchaseDate?: Date | null;
  isSandbox?: boolean;
  updatedAt?: Date | null;
  compUntil?: Date | null;
};

/**
 * useSubscription
 * - Subscribes to users/{uid} and maps `.subscription` to a simple status for UI gating.
 * - Read-only; backend writes subscription via webhook.
 */
export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>('inactive');
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const unsubDocRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Cleanup any prior doc sub when auth state changes
      if (unsubDocRef.current) {
        unsubDocRef.current();
        unsubDocRef.current = null;
      }

      if (!user) {
        setStatus('inactive');
        setSnapshot(null);
        setLoading(false);
        setError(undefined);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      unsubDocRef.current = onSnapshot(
        userRef,
        (snap) => {
          const data: any = snap.data() || {};
          const s = data.subscription || {};
          const toDate = (v: any): Date | null => {
            if (!v) return null;
            if (typeof v?.toDate === 'function') return v.toDate();
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
          };

          const sub: SubscriptionSnapshot = {
            status: (s.status as SubscriptionStatus) || 'inactive',
            plan: s.plan ?? null,
            productId: s.productId ?? null,
            platform: s.platform ?? null,
            willRenew: typeof s.willRenew === 'boolean' ? s.willRenew : null,
            expirationDate: toDate(s.expirationDate),
            originalPurchaseDate: toDate(s.originalPurchaseDate),
            isSandbox: !!s.isSandbox,
            updatedAt: toDate(s.updatedAt),
            compUntil: toDate(s.compUntil),
          };

          setSnapshot(sub);
          setStatus(sub.status);
          setLoading(false);
          setError(undefined);
        },
        (err) => {
          setError(err?.message || 'Subscription listener error');
          setLoading(false);
        }
      );
    });

    return () => {
      if (unsubDocRef.current) {
        unsubDocRef.current();
        unsubDocRef.current = null;
      }
      unsubAuth();
    };
  }, []);

  const compIsActive = (() => {
    const d = snapshot?.compUntil;
    return !!(d && Date.now() < d.getTime());
  })();
  const isActive = (status === 'active' || status === 'trial') || compIsActive;

  return { status, isActive, snapshot, loading, error } as const;
}
