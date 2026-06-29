import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { auth } from '../../../firebase/config';
import { historyService } from '../../../firebase/historyService';

const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "default-app-id";

export function useManagerAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const collections = ['partner_ads', 'user_sku_ads', 'billboard_ads'];
    const unsubscribes = [];
    let allData = { partner_ads: [], user_sku_ads: [], billboard_ads: [] };

    const updateUI = () => {
      let combined = [ ...allData.partner_ads, ...allData.user_sku_ads, ...allData.billboard_ads ];
      
      const uniqueAds = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      uniqueAds.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      
      setAds(uniqueAds);
      setLoading(false);
    };

    collections.forEach(colName => {
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', colName);
      // Query limiting to recent 50 ads per type to prevent quota leaks
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snapshot) => {
        allData[colName] = snapshot.docs.map(d => ({ id: d.id, _collection: colName, ...d.data() }));
        updateUI();
      }, (error) => {
        console.error(`❌ Error fetching ${colName}:`, error);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const handleAction = async (ad, action) => {
    if (!window.confirm(`ยืนยันการ ${action === 'APPROVED' ? 'อนุมัติให้แสดงผล' : 'ปฏิเสธคำขอ'} โฆษณานี้?`)) return;
    
    setProcessingId(ad.id);
    try {
      const batch = writeBatch(db);
      const actionData = { status: action, updatedAt: serverTimestamp() };

      batch.set(doc(db, 'artifacts', appId, 'public', 'data', ad._collection, ad.id), actionData, { merge: true });

      const taskId = `TODO-${ad.id}`;
      batch.set(doc(db, 'todos', taskId), actionData, { merge: true });

      await batch.commit();

      // Log the manager action
      const title = ad.title || ad.productName || 'ไม่มีหัวข้อ';
      await historyService.addLog(
        'ManagerAds', 
        action === 'APPROVED' ? 'ApproveAd' : (action === 'REJECTED' ? 'RejectAd' : 'RevertAd'), 
        ad.id, 
        `${action === 'APPROVED' ? 'อนุมัติ' : (action === 'REJECTED' ? 'ปฏิเสธ' : 'เปลี่ยนสถานะเป็นรอตรวจสอบ')}โฆษณา: ${title}`, 
        auth.currentUser?.uid
      );
    } catch (error) {
      console.error("🔥 Action error:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAds = ads.filter(ad => String(ad.status).toUpperCase() === activeTab);

  return {
    ads: filteredAds,
    loading,
    activeTab,
    setActiveTab,
    processingId,
    handleAction,
    pendingCount: ads.filter(a => String(a.status).toUpperCase() === 'PENDING').length
  };
}
