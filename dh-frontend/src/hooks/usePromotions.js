import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export function usePromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const now = new Date();
    try {
      const q = query(collection(db, 'promotions'), where('isActive', '==', true));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const activePromos = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let isValid = true;
          if (data.startDate) {
            const start = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate);
            if (now < start) isValid = false;
          }
          if (data.endDate) {
            const end = data.endDate.toDate ? data.endDate.toDate() : new Date(data.endDate);
            if (now > end) isValid = false;
          }
          if (isValid) activePromos.push({ id: doc.id, ...data });
        });
        activePromos.sort((a, b) => {
          if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        setPromotions(activePromos);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching promotions:', err);
        setError(err.message);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to setup promotions listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  return { promotions, loading, error };
}
