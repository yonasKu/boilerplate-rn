import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase/firebaseConfig';
import { Recap } from '../../../services/aiRecapService';

export const useAllRecaps = () => {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const recapsQuery = query(
          collection(db, 'recaps'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(recapsQuery);
        const recapsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
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
        });

        setRecaps(recapsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching recaps:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recaps');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { recaps, loading, error };
};
