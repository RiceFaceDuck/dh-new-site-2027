import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export function useSourcingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, getCollectionPath('sourcing_requests')), limit(100));
      unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          data.sort((a, b) => {
            const timeA = a.lastRequestedAt?.toMillis ? a.lastRequestedAt.toMillis() : 0;
            const timeB = b.lastRequestedAt?.toMillis ? b.lastRequestedAt.toMillis() : 0;
            return timeB - timeA;
          });
          setRequests(data);
          setLoading(false);
        },
        (error) => {
          console.warn("⚠️ sourcing_requests snapshot error:", error);
          setRequests([]);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("⚠️ sourcing_requests query catch:", err);
      setRequests([]);
      setLoading(false);
    }
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, getCollectionPath('sourcing_requests'), id), { status });
      return true;
    } catch (error) {
      console.error("Error updating sourcing request status:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      return false;
    }
  };

  const resetAllRequests = async () => {
    if (!requests || requests.length === 0) return true;
    try {
      const batch = writeBatch(db);
      requests.forEach((req) => {
        batch.delete(doc(db, getCollectionPath('sourcing_requests'), req.id));
      });
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error resetting sourcing requests:", error);
      alert("เกิดข้อผิดพลาดในการ Reset ข้อมูล");
      return false;
    }
  };

  return {
    requests,
    loading,
    updateStatus,
    resetAllRequests
  };
}
