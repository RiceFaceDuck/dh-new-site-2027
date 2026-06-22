import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';

const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "default-app-id";

export function useAdSubscriptions() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const collections = ['partner_ads', 'user_sku_ads', 'billboard_ads'];
    const unsubscribes = [];
    let allData = { partner_ads: [], user_sku_ads: [], billboard_ads: [] };

    const updateUI = () => {
      let combined = [ ...allData.partner_ads, ...allData.user_sku_ads, ...allData.billboard_ads ];
      
      // กรองเอกสารที่ซ้ำกันออก
      const uniqueAds = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      // เรียงจากใหม่ไปเก่า
      uniqueAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setAds(uniqueAds);
      setLoading(false);
    };

    collections.forEach(colName => {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', colName);
      const unsub = onSnapshot(colRef, (snapshot) => {
        allData[colName] = snapshot.docs.map(d => ({ id: d.id, _collection: colName, ...d.data() }));
        updateUI();
      }, (error) => {
        console.error(`❌ Error fetching ${colName}:`, error);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return { ads, loading };
}
