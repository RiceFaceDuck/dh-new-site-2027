import { collection, onSnapshot, query, orderBy, limit, getDocs, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

const getOrdersColRef = () => collection(db, getCollectionPath('orders'));

export const billingQueryService = {
  subscribeRecentOrders: (maxLimit = 100, dateRange = null, callback) => {
    let qArgs = [getOrdersColRef()];
    
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
      if (!searchTerm || searchTerm.trim().length < 2) return [];
      
      const term = searchTerm.trim();
      const termLower = term.toLowerCase();
      const isPhone = /^[0-9]+$/.test(term);
      const isOrderNum = term.toUpperCase().startsWith('DH-') || term.toUpperCase().startsWith('TEMP-');
      
      let results = [];
      const colRef = getOrdersColRef();

      if (isOrderNum) {
        const q = query(colRef, where('orderId', '==', term.toUpperCase()), limit(50));
        const snap = await getDocs(q);
        results = snap.docs.map(doc => {
          const data = doc.data();
          delete data.id;
          return { ...data, id: doc.id };
        });
      } else if (isPhone) {
        const q1 = query(colRef, where('customer.phone', '==', term), limit(50));
        const q2 = query(colRef, where('customerInfo.phone', '==', term), limit(50));
        const q3 = query(colRef, where('walkInPhone', '==', term), limit(50));
        const q4 = query(colRef, where('trackingNumber', '==', term), limit(50));
        const q5 = query(colRef, where('trackingNo', '==', term), limit(50));

        const [snap1, snap2, snap3, snap4, snap5] = await Promise.all([
          getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4), getDocs(q5)
        ]);
        
        results = [
          ...snap1.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap2.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap3.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap4.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap5.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; })
        ];
      } else {
        const q1 = query(colRef, where('customer.firstName', '==', term), limit(50));
        const q2 = query(colRef, where('customer.accountName', '==', term), limit(50));
        const q3 = query(colRef, where('customerInfo.fullName', '==', term), limit(50));
        const q4 = query(colRef, where('walkInName', '==', term), limit(50));
        const q5 = query(colRef, where('itemSkus', 'array-contains', term.toUpperCase()), limit(50));
        const q6 = query(colRef, where('itemSkus', 'array-contains', term), limit(50));

        const [snap1, snap2, snap3, snap4, snap5, snap6] = await Promise.all([
          getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4), getDocs(q5), getDocs(q6)
        ]);

        results = [
          ...snap1.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap2.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap3.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap4.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap5.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; }),
          ...snap6.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; })
        ];
      }

      // If no exact match found from specific index queries, perform deep text search across 300 recent orders
      if (results.length === 0) {
        const recentQuery = query(colRef, orderBy('createdAt', 'desc'), limit(300));
        const recentSnap = await getDocs(recentQuery);
        const allRecent = recentSnap.docs.map(d => { const data = d.data(); delete data.id; return { ...data, id: d.id }; });
        
        results = allRecent.filter(o => {
          const inOrderId = String(o.orderId || '').toLowerCase().includes(termLower);
          const inCustomer = String(o.customer?.accountName || '').toLowerCase().includes(termLower) ||
                             String(o.customer?.firstName || '').toLowerCase().includes(termLower) ||
                             String(o.customer?.lastName || '').toLowerCase().includes(termLower) ||
                             String(o.customer?.phone || '').includes(termLower) ||
                             String(o.customerInfo?.fullName || '').toLowerCase().includes(termLower) ||
                             String(o.customerInfo?.phone || '').includes(termLower) ||
                             String(o.walkInName || '').toLowerCase().includes(termLower) ||
                             String(o.walkInPhone || '').includes(termLower);
          const inStaff = String(o.staffNickname || '').toLowerCase().includes(termLower) ||
                          String(o.createdBy || '').toLowerCase().includes(termLower);
          const inTracking = String(o.trackingNumber || o.trackingNo || o.shippingTracking || '').toLowerCase().includes(termLower);
          const inTax = String(o.taxInvoiceInfo?.taxId || o.taxId || o.companyTaxId || '').toLowerCase().includes(termLower) ||
                        String(o.taxInvoiceInfo?.companyName || '').toLowerCase().includes(termLower);
          const inNotes = String(o.notes || o.remark || o.memo || '').toLowerCase().includes(termLower);
          const inItems = Array.isArray(o.items) && o.items.some(i => 
            String(i.sku || i.productCode || i.code || '').toLowerCase().includes(termLower) ||
            String(i.name || i.productName || i.title || '').toLowerCase().includes(termLower) ||
            String(i.model || i.brand || '').toLowerCase().includes(termLower) ||
            String(i.sn || i.serialNumber || '').toLowerCase().includes(termLower)
          );

          return inOrderId || inCustomer || inStaff || inTracking || inTax || inNotes || inItems;
        });
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
              collection(db, getCollectionPath('history_logs')), 
              where('targetId', '==', orderId), 
              orderBy('timestamp', 'desc'),
              limit(100)
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
  },

  getOrderById: async (orderId) => {
    try {
      if (!orderId) return null;
      const docRef = doc(db, getCollectionPath('orders'), orderId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        delete data.id;
        return { ...data, id: snap.id };
      }
      return null;
    } catch (error) {
      console.error("🔥 Error fetching order by ID:", error);
      return null;
    }
  },
  
  getOrderByOrderId: async (orderIdString) => {
    try {
      if (!orderIdString) return null;
      const q = query(getOrdersColRef(), where('orderId', '==', orderIdString.trim().toUpperCase()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        delete data.id;
        return { ...data, id: snap.docs[0].id };
      }
      return null;
    } catch (error) {
      console.error("🔥 Error fetching order by Order ID:", error);
      throw error;
    }
  },

  subscribeActiveServiceTodos: (callback) => {
    try {
      const q = query(
        collection(db, getCollectionPath('todos')),
        where('status', 'in', ['pending_manager', 'waiting_item', 'processing', 'pending']),
        limit(100)
      );
      return onSnapshot(q, (snapshot) => {
        const serviceMap = {};
        snapshot.docs.forEach(docSnap => {
          const t = docSnap.data();
          const orderId = t.referenceId || t.payload?.orderId || t.payload?.orderDocId;
          if (orderId) {
            if (!serviceMap[orderId]) {
              serviceMap[orderId] = { hasPendingClaim: false, hasPendingReturn: false, hasPendingTax: false };
            }
            if (t.type === 'CLAIM_APPROVAL' || t.type === 'CANCEL_CLAIM_APPROVAL') {
              serviceMap[orderId].hasPendingClaim = true;
            }
            if (t.type === 'RETURN_APPROVAL' || t.type === 'CANCEL_RETURN_APPROVAL') {
              serviceMap[orderId].hasPendingReturn = true;
            }
            if (t.type === 'TAX_INVOICE') {
              serviceMap[orderId].hasPendingTax = true;
            }
          }
        });
        if (callback) callback(serviceMap);
      }, (err) => {
        console.error("subscribeActiveServiceTodos error:", err);
        if (callback) callback({});
      });
    } catch (err) {
      console.error("Error setting up subscribeActiveServiceTodos:", err);
      if (callback) callback({});
      return () => {};
    }
  }
};

