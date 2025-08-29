import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../../lib/firebase/firebaseConfig';
import { RecapService, Recap } from '../../../services/aiRecapService';

export const useRecaps = (ownerId?: string, childId?: string) => {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecaps = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const fetchedRecaps = childId
        ? await RecapService.getRecapsByChild(userId, childId)
        : await RecapService.getRecaps(userId);
      setRecaps(fetchedRecaps);
      setError(null);
    } catch (e) {
      const err = e as Error;
      console.error('Failed to fetch recaps in useRecaps hook:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const target = ownerId || user?.uid;
      if (target) {
        fetchRecaps(target);
      } else {
        setRecaps([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchRecaps, ownerId]);

  return { recaps, loading, error, refresh: fetchRecaps };
};

export const useRecapsByType = (type: 'weekly' | 'monthly' | 'yearly', childId?: string) => {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecaps = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const fetchedRecaps = await RecapService.getRecapsByType(userId, type, childId);
      setRecaps(fetchedRecaps);
      setError(null);
    } catch (e) {
      const err = e as Error;
      console.error(`Failed to fetch ${type} recaps in useRecapsByType hook:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, childId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchRecaps(user.uid);
      } else {
        setRecaps([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchRecaps]);

  return { recaps, loading, error, refresh: fetchRecaps };
};
