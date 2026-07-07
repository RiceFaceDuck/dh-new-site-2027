import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../../../firebase/config';

export function useMyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'todos'),
      where('createdByUid', '==', auth.currentUser.uid),
      where('type', 'in', ['CLAIM_APPROVAL', 'RETURN_APPROVAL', 'CANCEL_CLAIM_APPROVAL', 'CANCEL_RETURN_APPROVAL']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClaims(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching claims:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { claims, loading };
}
