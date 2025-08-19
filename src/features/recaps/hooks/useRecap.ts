import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase/firebaseConfig';
import { Recap } from '../../../services/aiRecapService';

export const useRecap = (recapId?: string) => {
  const [recap, setRecap] = useState<Recap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recapId) {
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const recapDoc = doc(db, 'recaps', recapId);
        const docSnap = await getDoc(recapDoc);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          const recapData = {
            id: docSnap.id,
            ...data,
            media: {
              highlightPhotos: data.media?.highlightPhotos || data.summary?.media?.highlightPhotos || []
            },
            period: {
              startDate: data.period.startDate.toDate(),
              endDate: data.period.endDate.toDate(),
            },
            createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
            generatedAt: data.generatedAt ? data.generatedAt.toDate() : undefined,
          } as Recap;
          setRecap(recapData);
        } else {
          setError('Recap not found');
        }
      } catch (err) {
        console.error('Error fetching recap:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recap');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [recapId]);

  return { recap, loading, error };
};
