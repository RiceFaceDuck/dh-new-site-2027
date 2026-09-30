import { useState, useCallback } from 'react';
import { limit, collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { getCollectionPath } from 'dh-shared/src/firebase/pathUtils';

// Helper: Normalize Thai phone numbers to raw digits (e.g. "+66805052471" -> "0805052471")
const normalizePhone = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = String(phoneStr).replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) {
    digits = '0' + digits.substring(2);
  }
  return digits;
};

// Helper: Normalize names for flexible matching
const normalizeName = (nameStr) => {
  return String(nameStr || '').trim().toLowerCase().replace(/\s+/g, '');
};

// ⚡ In-memory Cache for Customer History (TTL: 5 minutes)
const historyCache = new Map();
const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;

// 🛡️ Strict Customer ID & Account Relationship Matching Engine
const isOrderMatchForCustomer = (orderData, orderDocId, customerObj) => {
  if (!orderData || !customerObj) return false;

  const custId = customerObj.id;
  const custUid = customerObj.uid;
  const custAccountId = customerObj.accountId;
  const custCode = customerObj.customerCode;
  const custEmail = customerObj.email ? String(customerObj.email).trim().toLowerCase() : null;
  const custPhone = normalizePhone(customerObj.phone || customerObj.phoneNumber || customerObj.contactPhone);

  const orderCust = orderData.customer || {};
  const orderCustInfo = orderData.customerInfo || {};

  const orderUid = orderCust.uid || orderData.userId || orderCustInfo.uid || orderData.customerId || orderData.customerUid;
  const orderId = orderCust.id || orderCustInfo.id;
  const orderAccountId = orderCust.accountId || orderCustInfo.accountId;
  const orderCode = orderCust.customerCode || orderCustInfo.customerCode;
  const orderEmail = (orderCust.email || orderCustInfo.email || orderData.email || '').trim().toLowerCase();
  const orderPhone = normalizePhone(orderCust.phone || orderCustInfo.phone || orderData.walkInPhone || orderData.phone);

  // 1️⃣ Rule 1: Strict Customer ID / Account ID / Code Match (Highest Priority)
  const idList = [custId, custUid, custAccountId, custCode].filter(Boolean);
  if (idList.length > 0) {
    if (
      (orderUid && orderUid !== 'WALK-IN' && idList.includes(orderUid)) ||
      (orderId && orderId !== 'WALK-IN' && idList.includes(orderId)) ||
      (orderAccountId && idList.includes(orderAccountId)) ||
      (orderCode && idList.includes(orderCode))
    ) {
      return true;
    }
  }

  // 2️⃣ Rule 2: Synced Email Match (If customer has a valid email)
  if (custEmail && custEmail.includes('@') && orderEmail && orderEmail.includes('@')) {
    if (custEmail === orderEmail) {
      return true;
    }
  }

  // 3️⃣ Rule 3: Exact Phone Match (If customer has a valid 9-10 digit phone)
  if (custPhone && custPhone.length >= 9 && orderPhone && orderPhone.length >= 9) {
    if (custPhone === orderPhone) {
      return true;
    }
  }

  return false;
};

export const useCustomerHistory = () => {
  const [customerHistory, setCustomerHistory] = useState({ 
    orders: [], 
    claims: [], 
    loading: false 
  });

  const fetchCustomerHistory = useCallback(async (customerParam) => {
    if (!customerParam) {
      setCustomerHistory({ orders: [], claims: [], loading: false });
      return;
    }

    const custObj = typeof customerParam === 'object' && customerParam !== null ? customerParam : { id: customerParam };
    const custPhone = normalizePhone(custObj.phone || custObj.phoneNumber || custObj.contactPhone);
    const cacheKey = custObj.uid || custObj.id || custObj.accountId || custPhone;

    // ⚡ 1. ตรวจสอบ Cache ใน Memory ก่อน เพื่อป้องกันการอ่าน Firestore ซ้ำซ้อน (0 Quota)
    if (cacheKey && historyCache.has(cacheKey)) {
      const cached = historyCache.get(cacheKey);
      if (Date.now() - cached.timestamp < HISTORY_CACHE_TTL_MS) {
        setCustomerHistory({ 
          orders: cached.orders, 
          claims: cached.claims, 
          loading: false 
        });
        return;
      }
    }

    setCustomerHistory(prev => ({ ...prev, loading: true }));

    try {
      const ordersRef = collection(db, getCollectionPath('orders'));
      const claimsRef = collection(db, getCollectionPath('claims'));

      const idSet = new Set();
      if (custObj.id) idSet.add(custObj.id);
      if (custObj.uid) idSet.add(custObj.uid);
      if (custObj.accountId) idSet.add(custObj.accountId);
      if (custObj.customerCode) idSet.add(custObj.customerCode);

      const idList = Array.from(idSet).filter(Boolean);

      const orderQueries = [];
      if (idList.length > 0) {
        orderQueries.push(getDocs(query(ordersRef, where('customer.uid', 'in', idList), limit(300))));
        orderQueries.push(getDocs(query(ordersRef, where('userId', 'in', idList), limit(300))));
        orderQueries.push(getDocs(query(ordersRef, where('customerInfo.uid', 'in', idList), limit(300))));
        orderQueries.push(getDocs(query(ordersRef, where('customerId', 'in', idList), limit(300))));
        orderQueries.push(getDocs(query(ordersRef, where('customer.accountId', 'in', idList), limit(300))));
      }

      if (custPhone && custPhone.length >= 9) {
        orderQueries.push(getDocs(query(ordersRef, where('customer.phone', '==', custPhone), limit(100))));
        orderQueries.push(getDocs(query(ordersRef, where('customerInfo.phone', '==', custPhone), limit(100))));
      }

      // 🛡️ Note: ตัด fallback query(ordersRef, limit(300)) ทิ้งเพื่อกำจัด Firestore Quota Leak 300 doc ต่อคลิก 100%

      const claimQueries = [];
      if (idList.length > 0) {
        claimQueries.push(getDocs(query(claimsRef, where('customerUid', 'in', idList), limit(300))));
        claimQueries.push(getDocs(query(claimsRef, where('uid', 'in', idList), limit(300))));
        claimQueries.push(getDocs(query(claimsRef, where('customerId', 'in', idList), limit(300))));
      }

      // 🛡️ Use Promise.allSettled so unindexed query failures never break successful queries
      const [orderResults, claimResults] = await Promise.all([
        Promise.allSettled(orderQueries),
        Promise.allSettled(claimQueries)
      ]);

      const uniqueOrders = new Map();

      orderResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value?.docs) {
          result.value.docs.forEach(docSnap => {
            if (uniqueOrders.has(docSnap.id)) return;
            const data = docSnap.data();

            if (isOrderMatchForCustomer(data, docSnap.id, custObj)) {
              uniqueOrders.set(docSnap.id, { id: docSnap.id, ...data });
            }
          });
        }
      });

      const uniqueClaims = new Map();
      claimResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value?.docs) {
          result.value.docs.forEach(docSnap => {
            if (uniqueClaims.has(docSnap.id)) return;
            const data = docSnap.data();
            if (isOrderMatchForCustomer(data, docSnap.id, custObj)) {
              uniqueClaims.set(docSnap.id, { id: docSnap.id, ...data });
            }
          });
        }
      });

      // Sort orders by timestamp descending
      const ordersData = Array.from(uniqueOrders.values()).sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.orderDate ? new Date(a.orderDate).getTime() : (typeof a.createdAt === 'number' ? a.createdAt : 0));
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.orderDate ? new Date(b.orderDate).getTime() : (typeof b.createdAt === 'number' ? b.createdAt : 0));
        return timeB - timeA;
      });

      const claimsData = Array.from(uniqueClaims.values());

      // 💾 บันทึกผลลัพธ์ลง In-memory Cache สำหรับ 5 นาทีถัดไป
      if (cacheKey) {
        historyCache.set(cacheKey, {
          timestamp: Date.now(),
          orders: ordersData,
          claims: claimsData
        });
      }

      setCustomerHistory({ 
        orders: ordersData, 
        claims: claimsData, 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching customer history:", error);
      setCustomerHistory({ orders: [], claims: [], loading: false });
    }
  }, []);

  const clearCustomerHistory = useCallback(() => {
    setCustomerHistory({ orders: [], claims: [], loading: false });
  }, []);

  return {
    state: { customerHistory },
    actions: { fetchCustomerHistory, clearCustomerHistory }
  };
};