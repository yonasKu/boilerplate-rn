import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase/firebaseConfig';
import { Recap } from '../../../services/aiRecapService';

export const useRecaps = (childId?: string) => {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setRecaps([]);
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'recaps'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (childId) {
      q = query(q, where('childId', '==', childId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recapsData: Recap[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          generatedAt: doc.data().generatedAt.toDate(),
        } as Recap));
        setRecaps(recapsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching recaps:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId, childId]);

  return { recaps, loading, error };
};

export const useRecapsByType = (type: 'weekly' | 'monthly' | 'yearly', childId?: string) => {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setRecaps([]);
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'recaps'),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );

    if (childId) {
      q = query(q, where('childId', '==', childId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const recapsData: Recap[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          generatedAt: doc.data().generatedAt.toDate(),
        } as Recap));
        setRecaps(recapsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching recaps by type:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId, type, childId]);

  return { recaps, loading, error };
};
