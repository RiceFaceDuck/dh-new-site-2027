import { collection, onSnapshot, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'orders';

export const billingQueryService = {
  subscribeRecentOrders: (maxLimit = 100, dateRange = null, callback) => {
    let qArgs = [collection(db, COLLECTION_NAME)];
    
    if (dateRange?.start) {
      const start = new Date(dateRange.start); 
      start.setHours(0, 0, 0, 0);
      qArgs.push(where('createdAt', '>=', Timestamp.fromDate(start)));
    }
    if (dateRange?.end) {
      const end = new Date(dateRange.end); 
      end.setHours(23, 59, 59, 999);
      qArgs.push(where('createdAt', '<=', Timestamp.fromDate(end)));
    }
    
    qArgs.push(orderBy('createdAt', 'desc'));
    qArgs.push(limit(maxLimit));

    const q = query(...qArgs);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        delete data.id; // Ensure we don't accidentally keep a null/invalid id from data
        return { ...data, id: doc.id };
      });
      if (callback) callback(orders);
    }, (error) => {
      console.error("subscribeRecentOrders Error:", error);
      if (callback) callback([]); // Send empty array on error to clear loading state and prevent stuck UI
    });

    return unsubscribe;
  },

  searchOrders: async (searchTerm) => {
    try {
      if (!searchTerm || searchTerm.length < 3) return [];
      
      const term = searchTerm.trim();
      const isPhone = /^[0-9]+$/.test(term);
      const isOrderNum = term.toUpperCase().startsWith('DH-') || term.toUpperCase().startsWith('TEMP-');
      
      let results = [];
      const colRef = collection(db, COLLECTION_NAME);

      if (isOrderNum) {
        const q = query(colRef, where('orderId', '==', term.toUpperCase()));
        const snap = await getDocs(q);
        results = snap.docs.map(doc => {
          const data = doc.data();
          delete data.id;
          return { ...data, id: doc.id };
        });
      } else if (isPhone) {
        const q1 = query(colRef, where('customer.phone', '==', term));
        const q2 = query(colRef, where('customerInfo.phone', '==', term));
        const q3 = query(colRef, where('walkInPhone', '==', term));

        const [snap1, snap2, snap3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
        
        results = [
          ...snap1.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap2.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap3.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; })
        ];
      } else {
        const q1 = query(colRef, where('customer.firstName', '==', term));
        const q2 = query(colRef, where('customer.accountName', '==', term));
        const q3 = query(colRef, where('customerInfo.fullName', '==', term));
        const q4 = query(colRef, where('walkInName', '==', term));

        const [snap1, snap2, snap3, snap4] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)]);

        results = [
          ...snap1.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap2.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap3.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap4.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; })
        ];
      }

      const uniqueResults = results.filter((v,i,a) => a.findIndex(t => (t.id === v.id)) === i);
      return uniqueResults.length > 0 ? uniqueResults : null;
    } catch (error) {
      console.error("🔥 Error searching orders:", error);
      return [];
    }
  },

  getOrderHistory: async (orderId) => {
      try {
          const q = query(
              collection(db, 'history_logs'), 
              where('targetId', '==', orderId), 
              orderBy('timestamp', 'desc')
          );
          const snap = await getDocs(q);
          return snap.docs.map(d => {
            const data = d.data();
            delete data.id;
            return { ...data, id: d.id };
          });
      } catch (error) {
          console.error("Error fetching order history:", error);
          return [];
      }
  }
};
