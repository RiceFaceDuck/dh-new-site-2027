import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

export const useHistoryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubs = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clear previous listeners
      unsubs.forEach(unsub => unsub && unsub());
      unsubs = [];

      if (user) {
        setIsLoading(true);
        const ordersMap = new Map();

        const updateOrdersState = () => {
          const list = Array.from(ordersMap.values());
          list.sort((a, b) => {
            const getTs = (o) => {
              if (!o) return 0;
              const t = o.createdAt || o.updatedAt || o.date;
              if (!t) return 0;
              if (typeof t.toDate === 'function') return t.toDate().getTime();
              if (t.seconds) return t.seconds * 1000;
              if (typeof t === 'number') return t;
              const n = new Date(t).getTime();
              return isNaN(n) ? 0 : n;
            };
            return getTs(b) - getTs(a);
          });
          setOrders(list);
          setIsLoading(false);
        };

        const ordersCol = collection(db, getCollectionPath('orders'));

        // Query 1: ออเดอร์ที่สั่งจากหน้าเว็บ หรือมีฟิลด์ userId ตรงกับ user.uid
        const q1 = query(ordersCol, where('userId', '==', user.uid), limit(100));

        // Query 2: ออเดอร์ที่เปิดจากระบบ POS หรือมี customer.uid ตรงกับ user.uid
        const q2 = query(ordersCol, where('customer.uid', '==', user.uid), limit(100));

        // Query 3: รองรับฟิลด์ customerId เก่า
        const q3 = query(ordersCol, where('customerId', '==', user.uid), limit(100));

        const handleSnapshot = (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'removed') {
              ordersMap.delete(change.doc.id);
            } else {
              ordersMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
            }
          });
          updateOrdersState();
        };

        const handleError = (error) => {
          console.error("Error fetching orders:", error);
          setIsLoading(false);
        };

        unsubs.push(onSnapshot(q1, handleSnapshot, handleError));
        unsubs.push(onSnapshot(q2, handleSnapshot, handleError));
        unsubs.push(onSnapshot(q3, handleSnapshot, handleError));
      } else {
        setOrders([]);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  return { orders, isLoading };
};
