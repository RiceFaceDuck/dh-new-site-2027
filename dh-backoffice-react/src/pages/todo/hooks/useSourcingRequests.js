import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export function useSourcingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, getCollectionPath('sourcing_requests')), orderBy('demandCount', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'sourcing_requests', id), { status });
      return true;
    } catch (error) {
      console.error("Error updating sourcing request status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      return false;
    }
  };

  return {
    requests,
    loading,
    updateStatus
  };
}
